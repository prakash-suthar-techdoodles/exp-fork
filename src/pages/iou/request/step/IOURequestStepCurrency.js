import Str from 'expensify-common/lib/str';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Keyboard} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import SelectionList from '@components/SelectionList';
import transactionPropTypes from '@components/transactionPropTypes';
import useLocalize from '@hooks/useLocalize';
import compose from '@libs/compose';
import * as CurrencyUtils from '@libs/CurrencyUtils';
import Navigation from '@libs/Navigation/Navigation';
import * as ReportActionsUtils from '@libs/ReportActionsUtils';
import * as ReportUtils from '@libs/ReportUtils';
import * as IOU from '@userActions/IOU';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES, {getUrlWithBackToParam} from '@src/ROUTES';
import IOURequestStepRoutePropTypes from './IOURequestStepRoutePropTypes';
import StepScreenWrapper from './StepScreenWrapper';
import withFullTransactionOrNotFound from './withFullTransactionOrNotFound';

/**
 * IOU Currency selection for selecting currency
 */
const propTypes = {
    /** Navigation route context info provided by react navigation */
    route: IOURequestStepRoutePropTypes.isRequired,

    /** The currency list constant object from Onyx */
    currencyList: PropTypes.objectOf(
        PropTypes.shape({
            /** Symbol for the currency */
            symbol: PropTypes.string,

            /** Name of the currency */
            name: PropTypes.string,

            /** ISO4217 Code for the currency */
            ISO4217: PropTypes.string,
        }),
    ),

    /* Onyx Props */
    /** The transaction being modified */
    transaction: transactionPropTypes,
};

const defaultProps = {
    currencyList: {},
    transaction: {},
};

function IOURequestStepCurrency({
    currencyList,
    route: {
        params: {backTo, iouType, pageIndex, reportID, transactionID, threadReportID, currency: paramCurrency},
    },
    transaction: {currency: transactionCurrency},
}) {
    const {translate} = useLocalize();
    const [searchValue, setSearchValue] = useState('');
    const optionsSelectorRef = useRef();
    const currency = paramCurrency || transactionCurrency;

    useEffect(() => {
        // Do not dismiss the modal, when it is not the edit flow.
        if (!threadReportID) {
            return;
        }

        const report = ReportUtils.getReport(threadReportID);
        const parentReportAction = ReportActionsUtils.getReportAction(report.parentReportID, report.parentReportActionID);

        // Do not dismiss the modal, when a current user can edit this currency of this money request.
        if (ReportUtils.canEditFieldOfMoneyRequest(parentReportAction, CONST.EDIT_REQUEST_FIELD.CURRENCY)) {
            return;
        }

        // Dismiss the modal when a current user cannot edit a money request.
        Navigation.isNavigationReady().then(() => {
            Navigation.dismissModal();
        });
    }, [threadReportID]);

    const navigateBack = (selectedCurrency = undefined) => {
        // If the currency selection was done from the confirmation step (eg. + > request money > manual > confirm > amount > currency)
        // then the user needs taken back to the confirmation page instead of the initial amount page. This is because the route params
        // are only able to handle one backTo param at a time and the user needs to go back to the amount page before going back
        // to the confirmation page
        if (pageIndex === 'confirm') {
            const routeToAmountPageWithConfirmationAsBackTo = getUrlWithBackToParam(backTo, `/${ROUTES.MONEY_REQUEST_STEP_CONFIRMATION.getRoute(iouType, transactionID, reportID)}`);
            Navigation.goBack(routeToAmountPageWithConfirmationAsBackTo);
            return;
        }

        if (pageIndex === 'edit' && selectedCurrency) {
            Navigation.navigate(`${backTo}?currency=${selectedCurrency}`);
            return;
        }

        Navigation.goBack(backTo || ROUTES.HOME);
    };

    /**
     * @param {Object} option
     * @param {String} options.currencyCode
     */
    const confirmCurrencySelection = (option) => {
        Keyboard.dismiss();
        IOU.setMoneyRequestCurrency_temporaryForRefactor(transactionID, option.currencyCode);
        navigateBack(option.currencyCode);
    };

    const {sections, headerMessage, initiallyFocusedOptionKey} = useMemo(() => {
        const currencyOptions = _.map(currencyList, (currencyInfo, currencyCode) => {
            const isSelectedCurrency = currencyCode === currency.toUpperCase();
            return {
                currencyName: currencyInfo.name,
                text: `${currencyCode} - ${CurrencyUtils.getLocalizedCurrencySymbol(currencyCode)}`,
                currencyCode,
                keyForList: currencyCode,
                isSelected: isSelectedCurrency,
            };
        });

        const searchRegex = new RegExp(Str.escapeForRegExp(searchValue.trim()), 'i');
        const filteredCurrencies = _.filter(currencyOptions, (currencyOption) => searchRegex.test(currencyOption.text) || searchRegex.test(currencyOption.currencyName));
        const isEmpty = searchValue.trim() && !filteredCurrencies.length;

        return {
            initiallyFocusedOptionKey: _.get(
                _.find(filteredCurrencies, (filteredCurrency) => filteredCurrency.currencyCode === currency.toUpperCase()),
                'keyForList',
            ),
            sections: isEmpty
                ? []
                : [
                      {
                          data: filteredCurrencies,
                          indexOffset: 0,
                      },
                  ],
            headerMessage: isEmpty ? translate('common.noResultsFound') : '',
        };
    }, [currencyList, searchValue, currency, translate]);

    return (
        <StepScreenWrapper
            headerTitle={translate('common.selectCurrency')}
            onBackButtonPress={navigateBack}
            onEntryTransitionEnd={() => optionsSelectorRef.current && optionsSelectorRef.current.focus()}
            shouldShowWrapper
            testID={IOURequestStepCurrency.displayName}
        >
            {({didScreenTransitionEnd}) => (
                <SelectionList
                    sections={sections}
                    textInputLabel={translate('common.search')}
                    textInputValue={searchValue}
                    onChangeText={setSearchValue}
                    onSelectRow={(option) => {
                        if (!didScreenTransitionEnd) {
                            return;
                        }
                        confirmCurrencySelection(option);
                    }}
                    headerMessage={headerMessage}
                    initiallyFocusedOptionKey={initiallyFocusedOptionKey}
                    showScrollIndicator
                />
            )}
        </StepScreenWrapper>
    );
}

IOURequestStepCurrency.displayName = 'IOURequestStepCurrency';
IOURequestStepCurrency.propTypes = propTypes;
IOURequestStepCurrency.defaultProps = defaultProps;

export default compose(
    withFullTransactionOrNotFound,
    withOnyx({
        currencyList: {key: ONYXKEYS.CURRENCY_LIST},
    }),
)(IOURequestStepCurrency);

import {getYear, setYear} from 'date-fns';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React, {useCallback, useMemo, useState} from 'react';
import _ from 'underscore';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import withNavigation from '@components/withNavigation';
import useLocalize from '@hooks/useLocalize';
import Navigation from '@libs/Navigation/Navigation';
import CONST from '@src/CONST';

const propTypes = {
    /** Route from navigation */
    route: PropTypes.shape({
        /** Params from the route */
        params: PropTypes.shape({
            /** Currently selected year */
            year: PropTypes.string,
        }),
    }).isRequired,

    /** Navigation from react-navigation */
    navigation: PropTypes.shape({
        /** getState function retrieves the current navigation state from react-navigation's navigation property */
        getState: PropTypes.func.isRequired,
    }).isRequired,

    /** Minimum year to show in the list */
    minYear: PropTypes.number,

    /** Maximum year to show in the list */
    maxYear: PropTypes.number,

    /** Route to go back to */
    backTo: PropTypes.string,
};

const defaultProps = {
    maxYear: getYear(setYear(new Date(), CONST.CALENDAR_PICKER.MAX_YEAR)),
    minYear: getYear(setYear(new Date(), CONST.CALENDAR_PICKER.MIN_YEAR)),
    backTo: '',
};

function YearPicker({route, navigation, minYear, maxYear, backTo}) {
    const yearsArray = Array.from({length: maxYear - minYear + 1}, (v, i) => i + minYear);
    const {translate} = useLocalize();
    const [searchText, setSearchText] = useState('');

    const currentYear = lodashGet(route, 'params.year', new Date().getFullYear());
    const years = useMemo(
        () =>
            _.map(yearsArray, (year) => {
                const yearString = year.toString();
                return {
                    value: year,
                    keyForList: yearString,
                    text: yearString,
                    isSelected: currentYear === yearString,
                    searchValue: yearString,
                };
            }),
        [currentYear, yearsArray],
    );

    const searchResults = searchText.trim() ? _.filter(years, (year) => year.searchValue.includes(searchText)) : years;
    const headerMessage = searchText.trim() && !searchResults.length ? translate('common.noResultsFound') : '';

    const selectYear = useCallback(
        (option) => {
            // Check the navigation state and "backTo" parameter to decide navigation behavior
            if (navigation.getState().routes.length === 1 && _.isEmpty(backTo)) {
                // If there is only one route and "backTo" is empty, go back in navigation
                Navigation.goBack();
            } else if (!_.isEmpty(backTo) && navigation.getState().routes.length === 1) {
                // If "backTo" is not empty and there is only one route, go back to the specific route defined in "backTo" with a year parameter
                Navigation.goBack(`${backTo}?year=${option.value}`);
            } else {
                // Otherwise, navigate to the specific route defined in "backTo" with a year parameter
                Navigation.navigate(`${backTo}?year=${option.value}`);
            }
        },
        [navigation, backTo],
    );

    return (
        <ScreenWrapper
            testID={YearPicker.displayName}
            includeSafeAreaPaddingBottom={false}
        >
            <HeaderWithBackButton
                title={translate('yearPickerPage.year')}
                onBackButtonPress={() => {
                    const backToRoute = backTo ? `${backTo}?year=${currentYear}` : '';
                    Navigation.goBack(backToRoute);
                }}
            />
            <SelectionList
                shouldDelayFocus
                textInputLabel={translate('yearPickerPage.selectYear')}
                textInputValue={searchText}
                textInputMaxLength={4}
                onChangeText={(text) => setSearchText(text.replace(CONST.REGEX.NON_NUMERIC, '').trim())}
                keyboardType={CONST.KEYBOARD_TYPE.NUMBER_PAD}
                headerMessage={headerMessage}
                sections={[{data: searchResults, indexOffset: 0}]}
                onSelectRow={selectYear}
                initiallyFocusedOptionKey={currentYear.toString()}
                showScrollIndicator
                shouldUseDynamicMaxToRenderPerBatch
                shouldStopPropagation
            />
        </ScreenWrapper>
    );
}

YearPicker.displayName = 'YearPicker';
YearPicker.propTypes = propTypes;
YearPicker.defaultProps = defaultProps;

export default withNavigation(YearPicker);

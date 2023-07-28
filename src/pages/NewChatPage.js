import _ from 'underscore';
import React, {useState, useEffect, useMemo} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ButtonToggleNewChat from '../components/ButtonToggle/ButtonToggleNewChat';
import OptionsSelector from '../components/OptionsSelector';
import Permissions from '../libs/Permissions';
import * as OptionsListUtils from '../libs/OptionsListUtils';
import * as ReportUtils from '../libs/ReportUtils';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import * as Report from '../libs/actions/Report';
import CONST from '../CONST';
import withWindowDimensions, {windowDimensionsPropTypes} from '../components/withWindowDimensions';
import HeaderWithBackButton from '../components/HeaderWithBackButton';
import ScreenWrapper from '../components/ScreenWrapper';
import withLocalize, {withLocalizePropTypes} from '../components/withLocalize';
import * as Browser from '../libs/Browser';
import compose from '../libs/compose';
import personalDetailsPropType from './personalDetailsPropType';
import reportPropTypes from './reportPropTypes';

const propTypes = {
    /** Beta features list */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** All of the personal details for everyone */
    personalDetails: personalDetailsPropType,

    /** All reports shared with the user */
    reports: PropTypes.objectOf(reportPropTypes),

    ...windowDimensionsPropTypes,

    ...withLocalizePropTypes,
};

const defaultProps = {
    betas: [],
    personalDetails: {},
    reports: {},
};

const excludedGroupEmails = _.without(CONST.EXPENSIFY_EMAILS, CONST.EMAIL.CONCIERGE);

function NewChatPage(props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRecentReports, setFilteredRecentReports] = useState([]);
    const [filteredPersonalDetails, setFilteredPersonalDetails] = useState([]);
    const [filteredUserToInvite, setFilteredUserToInvite] = useState();
    const [selectedOptions, setSelectedOptions] = useState([]);

    const maxParticipantsReached = selectedOptions.length === CONST.REPORT.MAXIMUM_PARTICIPANTS;
    const headerMessage = OptionsListUtils.getHeaderMessage(
        filteredPersonalDetails.length + filteredRecentReports.length !== 0,
        Boolean(filteredUserToInvite),
        searchTerm,
        maxParticipantsReached,
    );
    const isOptionsDataReady = ReportUtils.isReportDataReady() && OptionsListUtils.isPersonalDetailsReady(props.personalDetails);

    const sections = useMemo(() => {
        const sectionsList = [];
        let indexOffset = 0;

        sectionsList.push({
            title: undefined,
            data: selectedOptions,
            shouldShow: !_.isEmpty(selectedOptions),
            indexOffset,
        });
        indexOffset += selectedOptions.length;

        if (maxParticipantsReached) {
            return sectionsList;
        }

        // Filtering out selected users from the search results
        const filterText = _.reduce(selectedOptions, (str, {login}) => `${str} ${login}`, '');
        const recentReportsWithoutSelected = _.filter(filteredRecentReports, ({login}) => !filterText.includes(login));
        const personalDetailsWithoutSelected = _.filter(filteredPersonalDetails, ({login}) => !filterText.includes(login));
        const hasUnselectedUserToInvite = filteredUserToInvite && !filterText.includes(filteredUserToInvite.login);

        sectionsList.push({
            title: props.translate('common.recents'),
            data: recentReportsWithoutSelected,
            shouldShow: !_.isEmpty(recentReportsWithoutSelected),
            indexOffset,
        });
        indexOffset += recentReportsWithoutSelected.length;

        sectionsList.push({
            title: props.translate('common.contacts'),
            data: personalDetailsWithoutSelected,
            shouldShow: !_.isEmpty(personalDetailsWithoutSelected),
            indexOffset,
        });
        indexOffset += personalDetailsWithoutSelected.length;

        if (hasUnselectedUserToInvite) {
            sectionsList.push({
                title: undefined,
                data: [filteredUserToInvite],
                shouldShow: true,
                indexOffset,
            });
        }

        return sectionsList;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredPersonalDetails, filteredRecentReports, filteredUserToInvite, maxParticipantsReached, selectedOptions]);

    /**
     * Removes a selected option from list if already selected. If not already selected add this option to the list.
     * @param {Object} option
     */
    function toggleOption(option) {
        const isOptionInList = _.some(selectedOptions, (selectedOption) => selectedOption.login === option.login);

        let newSelectedOptions;

        if (isOptionInList) {
            newSelectedOptions = _.reject(selectedOptions, (selectedOption) => selectedOption.login === option.login);
        } else {
            newSelectedOptions = [...selectedOptions, option];
        }

        const {recentReports, personalDetails, userToInvite} = OptionsListUtils.getNewChatOptions(props.reports, props.personalDetails, props.betas, searchTerm, [], excludedGroupEmails);

        setSelectedOptions(newSelectedOptions);
        setFilteredRecentReports(recentReports);
        setFilteredPersonalDetails(personalDetails);
        setFilteredUserToInvite(userToInvite);
    }

    /**
     * Creates a new 1:1 chat with the option and the current user,
     * or navigates to the existing chat if one with those participants already exists.
     *
     * @param {Object} option
     */
    function createChat(option) {
        Report.navigateToAndOpenReport([option.login]);
    }

    /**
     * Creates a new group chat with all the selected options and the current user,
     * or navigates to the existing chat if one with those participants already exists.
     */
    const createGroup = () => {
        const logins = _.pluck(selectedOptions, 'login');
        if (logins.length < 1) {
            return;
        }
        Report.navigateToAndOpenReport(logins);
    };

    useEffect(() => {
        const {recentReports, personalDetails, userToInvite} = OptionsListUtils.getNewChatOptions(
            props.reports,
            props.personalDetails,
            props.betas,
            searchTerm,
            [],
        );
        setFilteredRecentReports(recentReports);
        setFilteredPersonalDetails(personalDetails);
        setFilteredUserToInvite(userToInvite);
        // props.betas is not added as dependency since it doesn't change during the component lifecycle
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.reports, props.personalDetails, searchTerm]);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
        >
            {({safeAreaPaddingBottomStyle}) => (
                <>
                    <HeaderWithBackButton title={props.translate('sidebarScreen.fabNewChat')} />
                    {Permissions.canUsePolicyRooms(props.betas) && <ButtonToggleNewChat activeToggle="chat" />}
                    <View style={[styles.flex1, styles.w100, styles.pRelative, selectedOptions.length > 0 ? safeAreaPaddingBottomStyle : {}]}>
                        <OptionsSelector
                            canSelectMultipleOptions
                            shouldShowMultipleOptionSelectorAsButton
                            multipleOptionSelectorButtonText={props.translate('newChatPage.addToGroup')}
                            onAddToSelection={(option) => toggleOption(option)}
                            sections={sections}
                            selectedOptions={selectedOptions}
                            value={searchTerm}
                            onSelectRow={(option) => createChat(option)}
                            onChangeText={setSearchTerm}
                            headerMessage={headerMessage}
                            boldStyle
                            shouldFocusOnSelectRow={!Browser.isMobile()}
                            shouldShowOptions={isOptionsDataReady}
                            shouldShowConfirmButton
                            confirmButtonText={selectedOptions.length > 1 ? props.translate('newChatPage.createGroup') : props.translate('newChatPage.createChat')}
                            onConfirmSelection={createGroup}
                            textInputLabel={props.translate('optionsSelector.nameEmailOrPhoneNumber')}
                            safeAreaPaddingBottomStyle={safeAreaPaddingBottomStyle}
                        />
                    </View>
                </>
            )}
        </ScreenWrapper>
    );
}

NewChatPage.propTypes = propTypes;
NewChatPage.defaultProps = defaultProps;
NewChatPage.displayName = 'NewChatPage';

export default compose(
    withLocalize,
    withWindowDimensions,
    withOnyx({
        reports: {
            key: ONYXKEYS.COLLECTION.REPORT,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS_LIST,
        },
        betas: {
            key: ONYXKEYS.BETAS,
        },
    }),
)(NewChatPage);

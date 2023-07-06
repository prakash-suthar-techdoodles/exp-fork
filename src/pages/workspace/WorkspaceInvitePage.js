import React, {useEffect, useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import lodashGet from 'lodash/get';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import ScreenWrapper from '../../components/ScreenWrapper';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';
import Navigation from '../../libs/Navigation/Navigation';
import styles from '../../styles/styles';
import compose from '../../libs/compose';
import ONYXKEYS from '../../ONYXKEYS';
import * as Policy from '../../libs/actions/Policy';
import usePrevious from '../../hooks/usePrevious';
import FormAlertWithSubmitButton from '../../components/FormAlertWithSubmitButton';
import OptionsSelector from '../../components/OptionsSelector';
import * as OptionsListUtils from '../../libs/OptionsListUtils';
import CONST from '../../CONST';
import * as Link from '../../libs/actions/Link';
import {policyPropTypes, policyDefaultProps} from './withPolicy';
import withPolicyAndFullscreenLoading from './withPolicyAndFullscreenLoading';
import {withNetwork} from '../../components/OnyxProvider';
import FullPageNotFoundView from '../../components/BlockingViews/FullPageNotFoundView';
import networkPropTypes from '../../components/networkPropTypes';
import ROUTES from '../../ROUTES';
import * as Browser from '../../libs/Browser';
import * as PolicyUtils from '../../libs/PolicyUtils';

const personalDetailsPropTypes = PropTypes.shape({
    /** The login of the person (either email or phone number) */
    login: PropTypes.string.isRequired,

    /** The URL of the person's avatar (there should already be a default avatar if
    the person doesn't have their own avatar uploaded yet, except for anon users) */
    avatar: PropTypes.string,

    /** This is either the user's full name, or their login if full name is an empty string */
    displayName: PropTypes.string,
});

const propTypes = {
    /** Beta features list */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** All of the personal details for everyone */
    personalDetails: PropTypes.objectOf(personalDetailsPropTypes),

    /** URL Route params */
    route: PropTypes.shape({
        /** Params from the URL path */
        params: PropTypes.shape({
            /** policyID passed via route: /workspace/:policyID/invite */
            policyID: PropTypes.string,
        }),
    }).isRequired,

    ...policyPropTypes,
    ...withLocalizePropTypes,
    network: networkPropTypes.isRequired,
};

const defaultProps = {
    personalDetails: {},
    betas: [],
    ...policyDefaultProps,
};

function WorkspaceInvitePage(props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [personalDetails, setPersonalDetails] = useState({});
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [userToInvite, setUserToInvite] = useState([]);
    const isPrevOffline = usePrevious(props.network.isOfflline);
    const prevPersonalDetails = usePrevious(props.personalDetails);
    const prevPolicyMembers = usePrevious(props.policyMembers);

    const clearErrors = useCallback(() => {
        Policy.setWorkspaceErrors(props.route.params.policyID, {});
        Policy.hideWorkspaceAlertMessage(props.route.params.policyID);
    }, [props.route.params.policyID]);

    const getExcludedUsers = useCallback(() => {
        // Exclude any expensify emails or valid policy members from the invite options
        const memberEmailsToExclude = [...CONST.EXPENSIFY_EMAILS];
        _.each(props.policyMembers, (policyMember, accountID) => {
            // Policy members that are pending delete or have errors are not valid and we should show them in the invite options (don't exclude them).
            if (policyMember.pendingAction === CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE || !_.isEmpty(policyMember.errors)) {
                return;
            }
            const memberEmail = lodashGet(props.personalDetails, `[${accountID}].login`);
            if (!memberEmail) {
                return;
            }
            memberEmailsToExclude.push(memberEmail);
        });
        return memberEmailsToExclude;
    }, [props.personalDetails, props.policyMembers]);

    const updateOptionsWithSearchTerm = useCallback(
        (newSearchTerm = '') => {
            const {personalDetails: newPersonalDetails, userToInvite: newUserToInvite} = OptionsListUtils.getMemberInviteOptions(
                props.personalDetails,
                props.betas,
                newSearchTerm,
                getExcludedUsers(),
            );

            // Update selectedOptions with the latest personalDetails and policyMembers information
            const detailsMap = {};
            _.forEach(personalDetails, (detail) => (detailsMap[detail.login] = detail));

            const newSelectedOptions = [];
            _.forEach(selectedOptions, (option) => {
                newSelectedOptions.push(_.has(detailsMap, option.login) ? detailsMap[option.login] : option);
            });

            setPersonalDetails(newPersonalDetails);
            setUserToInvite(newUserToInvite);
            setSearchTerm(newSearchTerm);
            setSelectedOptions(newSelectedOptions);
        },
        [props.personalDetails, props.betas, personalDetails, selectedOptions],
    );

    useEffect(() => {
        clearErrors();
        const policyMemberEmailsToAccountIDs = PolicyUtils.getClientPolicyMemberEmailsToAccountIDs(props.policyMembers, props.personalDetails);
        Policy.openWorkspaceInvitePage(props.route.params.policyID, _.keys(policyMemberEmailsToAccountIDs));
    }, [clearErrors, props.route.params.policyID, props.policyMembers, props.personalDetails]);

    useEffect(() => {
        if (!_.isEqual(prevPersonalDetails, props.personalDetails) || !_.isEqual(prevPolicyMembers, props.policyMembers)) {
            updateOptionsWithSearchTerm(searchTerm);
        }

        const isReconnecting = isPrevOffline && !props.network.isOffline;
        if (!isReconnecting) {
            return;
        }

        const policyMemberEmailsToAccountIDs = PolicyUtils.getClientPolicyMemberEmailsToAccountIDs(props.policyMembers, props.personalDetails);
        Policy.openWorkspaceInvitePage(props.route.params.policyID, _.keys(policyMemberEmailsToAccountIDs));
    }, [
        props.personalDetails,
        props.policyMembers,
        props.network.isOffline,
        props.route.params.policyID,
        prevPersonalDetails,
        prevPolicyMembers,
        isPrevOffline,
        updateOptionsWithSearchTerm,
        searchTerm,
    ]);

    /**
     * @returns {Boolean}
     */
    const getShouldShowAlertPrompt = useCallback(() => _.size(lodashGet(props.policy, 'errors', {})) > 0 || lodashGet(props.policy, 'alertMessage', '').length > 0, [props.policy]);

    /**
     * Returns the sections needed for the OptionsSelector
     * @returns {Array}
     */
    const getSections = useCallback(() => {
        const sections = [];
        let indexOffset = 0;

        sections.push({
            title: undefined,
            data: selectedOptions,
            shouldShow: true,
            indexOffset,
        });
        indexOffset += selectedOptions.length;

        // Filtering out selected users from the search results
        const filterText = _.reduce(selectedOptions, (str, {login}) => `${str} ${login}`, '');
        const personalDetailsWithoutSelected = _.filter(personalDetails, ({login}) => !filterText.includes(login));
        const hasUnselectedUserToInvite = userToInvite && !filterText.includes(userToInvite.login);

        sections.push({
            title: props.translate('common.contacts'),
            data: personalDetailsWithoutSelected,
            shouldShow: !_.isEmpty(personalDetailsWithoutSelected),
            indexOffset,
        });
        indexOffset += personalDetailsWithoutSelected.length;

        if (hasUnselectedUserToInvite) {
            sections.push({
                title: undefined,
                data: [userToInvite],
                shouldShow: true,
                indexOffset,
            });
        }

        return sections;
    }, [selectedOptions, personalDetails, userToInvite, props.translate]);

    const openPrivacyURL = useCallback((e) => {
        e.preventDefault();
        Link.openExternalLink(CONST.PRIVACY_URL);
    }, []);

    /**
     * Removes a selected option from list if already selected. If not already selected add this option to the list.
     * @param {Object} option
     */
    const toggleOption = useCallback(
        (option) => {
            clearErrors();
            const isOptionInList = _.some(selectedOptions, (selectedOption) => selectedOption.login === option.login);

            let newSelectedOptions;
            if (isOptionInList) {
                newSelectedOptions = _.reject(selectedOptions, (selectedOption) => selectedOption.login === option.login);
            } else {
                newSelectedOptions = [...selectedOptions, option];
            }

            const {personalDetails: newPersonalDetails, userToInvite: newUserToInvite} = OptionsListUtils.getMemberInviteOptions(
                props.personalDetails,
                props.betas,
                searchTerm,
                getExcludedUsers(),
            );
            setSelectedOptions(newSelectedOptions);
            setPersonalDetails(newPersonalDetails);
            setUserToInvite(newUserToInvite);
        },
        [clearErrors, selectedOptions, props.personalDetails, props.betas, searchTerm, getExcludedUsers],
    );

    /**
     * @returns {Boolean}
     */
    const validate = useCallback(() => {
        const errors = {};
        if (selectedOptions.length <= 0) {
            errors.noUserSelected = true;
        }

        Policy.setWorkspaceErrors(props.route.params.policyID, errors);
        return _.size(errors) <= 0;
    }, [props.route.params.policyID, selectedOptions]);

    /**
     * Handle the invite button click
     */
    const inviteUser = useCallback(() => {
        if (!validate()) {
            return;
        }

        const invitedEmailsToAccountIDs = {};
        _.each(selectedOptions, (option) => {
            const login = option.login || '';
            const accountID = lodashGet(option, 'participantsList[0].accountID');
            if (!login.toLowerCase().trim() || !accountID) {
                return;
            }
            invitedEmailsToAccountIDs[login] = Number(accountID);
        });
        Policy.setWorkspaceInviteMembersDraft(props.route.params.policyID, invitedEmailsToAccountIDs);
        Navigation.navigate(ROUTES.getWorkspaceInviteMessageRoute(props.route.params.policyID));
    }, [validate, selectedOptions, props.route.params.policyID]);

    const sections = getSections();
    const headerMessage = OptionsListUtils.getHeaderMessage(personalDetails.length !== 0, Boolean(userToInvite), searchTerm);
    const policyName = lodashGet(props.policy, 'name');

    return (
        <ScreenWrapper shouldEnableMaxHeight>
            <FullPageNotFoundView
                shouldShow={_.isEmpty(props.policy)}
                onBackButtonPress={() => Navigation.goBack(ROUTES.SETTINGS_WORKSPACES)}
            >
                <HeaderWithBackButton
                    title={props.translate('workspace.invite.invitePeople')}
                    subtitle={policyName}
                    shouldShowGetAssistanceButton
                    guidesCallTaskID={CONST.GUIDES_CALL_TASK_IDS.WORKSPACE_MEMBERS}
                    onBackButtonPress={() => {
                        clearErrors();
                        Navigation.goBack(ROUTES.getWorkspaceMembersRoute(props.route.params.policyID));
                    }}
                />
                <View style={[styles.flexGrow1, styles.flexShrink0, styles.flexBasisAuto]}>
                    <OptionsSelector
                        contentContainerStyles={[styles.flexGrow1, styles.flexShrink0, styles.flexBasisAuto]}
                        listContainerStyles={[styles.flexGrow1, styles.flexShrink1, styles.flexBasis0]}
                        canSelectMultipleOptions
                        sections={sections}
                        selectedOptions={selectedOptions}
                        value={searchTerm}
                        shouldShowOptions={OptionsListUtils.isPersonalDetailsReady(props.personalDetails)}
                        onSelectRow={toggleOption}
                        onChangeText={updateOptionsWithSearchTerm}
                        onConfirmSelection={inviteUser}
                        headerMessage={headerMessage}
                        hideSectionHeaders
                        boldStyle
                        shouldFocusOnSelectRow={!Browser.isMobile()}
                        textInputLabel={props.translate('optionsSelector.nameEmailOrPhoneNumber')}
                    />
                </View>
                <View style={[styles.flexShrink0]}>
                    <FormAlertWithSubmitButton
                        isDisabled={!selectedOptions.length}
                        isAlertVisible={getShouldShowAlertPrompt()}
                        buttonText={props.translate('common.next')}
                        onSubmit={inviteUser}
                        message={props.policy.alertMessage}
                        containerStyles={[styles.flexReset, styles.flexGrow0, styles.flexShrink0, styles.flexBasisAuto, styles.mb5]}
                        enabledWhenOffline
                        disablePressOnEnter
                    />
                </View>
            </FullPageNotFoundView>
        </ScreenWrapper>
    );
}

WorkspaceInvitePage.propTypes = propTypes;
WorkspaceInvitePage.defaultProps = defaultProps;
WorkspaceInvitePage.defaultName = 'WorkspaceInvitePage';

export default compose(
    withLocalize,
    withPolicyAndFullscreenLoading,
    withNetwork(),
    withOnyx({
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS_LIST,
        },
        betas: {
            key: ONYXKEYS.BETAS,
        },
    }),
)(WorkspaceInvitePage);

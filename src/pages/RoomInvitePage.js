import Str from 'expensify-common/lib/str';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React, {useCallback, useMemo} from 'react';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MemberInviteList from '@components/MemberInviteList';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import compose from '@libs/compose';
import * as DeviceCapabilities from '@libs/DeviceCapabilities';
import * as LoginUtils from '@libs/LoginUtils';
import Navigation from '@libs/Navigation/Navigation';
import * as PersonalDetailsUtils from '@libs/PersonalDetailsUtils';
import {parsePhoneNumber} from '@libs/PhoneNumber';
import * as PolicyUtils from '@libs/PolicyUtils';
import * as ReportUtils from '@libs/ReportUtils';
import * as Report from '@userActions/Report';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import withReportOrNotFound from './home/report/withReportOrNotFound';
import reportPropTypes from './reportPropTypes';
import {policyDefaultProps, policyPropTypes} from './workspace/withPolicy';

const propTypes = {
    /** URL Route params */
    route: PropTypes.shape({
        /** Params from the URL path */
        params: PropTypes.shape({
            /** policyID passed via route: /workspace/:policyID/invite */
            policyID: PropTypes.string,
        }),
    }).isRequired,

    /** The report currently being looked at */
    report: reportPropTypes.isRequired,

    /** The policies which the user has access to and which the report could be tied to */
    policies: PropTypes.shape({
        /** ID of the policy */
        id: PropTypes.string,
    }).isRequired,

    ...policyPropTypes,
};

const defaultProps = {
    ...policyDefaultProps,
};

function RoomInvitePage(props) {
    const {translate} = useLocalize();

    // Non policy members should not be able to view the participants of a room
    const reportID = props.report.reportID;
    const isPolicyMember = useMemo(() => PolicyUtils.isPolicyMember(props.report.policyID, props.policies), [props.report.policyID, props.policies]);
    const backRoute = useMemo(() => (isPolicyMember ? ROUTES.ROOM_MEMBERS.getRoute(reportID) : ROUTES.REPORT_WITH_ID_DETAILS.getRoute(reportID)), [isPolicyMember, reportID]);
    const reportName = useMemo(() => ReportUtils.getReportName(props.report), [props.report]);

    // Any existing participants and Expensify emails should not be eligible for invitation
    const excludedUsers = useMemo(() => [...PersonalDetailsUtils.getLoginsByAccountIDs(lodashGet(props.report, 'participantAccountIDs', [])), ...CONST.EXPENSIFY_EMAILS], [props.report]);

    const inviteUsers = useCallback(
        (selectedEmailsToAccountIDs) => {
            Report.inviteToRoom(props.report.reportID, selectedEmailsToAccountIDs);
            Navigation.navigate(backRoute);
        },
        [backRoute, props.report.reportID],
    );

    return (
        <ScreenWrapper
            shouldEnableMaxHeight
            testID={RoomInvitePage.displayName}
        >
            {({didScreenTransitionEnd}) => (
                <FullPageNotFoundView
                    shouldShow={_.isEmpty(props.report)}
                    subtitleKey={_.isEmpty(props.report) ? undefined : 'roomMembersPage.notAuthorized'}
                    onBackButtonPress={() => Navigation.goBack(backRoute)}
                >
                    <HeaderWithBackButton
                        title={translate('workspace.invite.invitePeople')}
                        subtitle={reportName}
                        onBackButtonPress={() => {
                            Navigation.goBack(backRoute);
                        }}
                    />
                    <MemberInviteList
                        inviteUsers={inviteUsers}
                        excludedUsers={excludedUsers}
                        name={reportName}
                        confirmButtonText={translate('common.invite')}
                        showLoadingPlaceholder={!didScreenTransitionEnd}
                    />
                </FullPageNotFoundView>
            )}
        </ScreenWrapper>
    );
}

RoomInvitePage.propTypes = propTypes;
RoomInvitePage.defaultProps = defaultProps;
RoomInvitePage.displayName = 'RoomInvitePage';

export default compose(
    withReportOrNotFound(),
    withOnyx({
        policies: {
            key: ONYXKEYS.COLLECTION.POLICY,
        },
    }),
)(RoomInvitePage);

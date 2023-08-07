import React, {useEffect} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import AttachmentModal from '../../../components/AttachmentModal';
import Navigation from '../../../libs/Navigation/Navigation';
import * as Report from '../../../libs/actions/Report';
import * as ReportUtils from '../../../libs/ReportUtils';
import * as ReportActionUtils from '../../../libs/ReportActionsUtils';
import ROUTES from '../../../ROUTES';
import ONYXKEYS from '../../../ONYXKEYS';
import lodashGet from 'lodash/get';
import {withOnyx} from 'react-native-onyx';

const propTypes = {
    /** Navigation route context info provided by react navigation */
    route: PropTypes.shape({
        /** Route specific parameters used on this screen */
        params: PropTypes.shape({
            /** The report ID which the attachment is associated with */
            reportID: PropTypes.string.isRequired,
            /** The uri encoded source of the attachment */
            source: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
};

/**
 * Get the currently viewed report ID as number
 *
 * @param {Object} route
 * @param {Object} route.params
 * @param {String} route.params.reportID
 * @returns {String}
 */
function getReportID(route) {
    return String(lodashGet(route, 'params.reportID', null));
}

function ReportAttachments(props) {
    const reportID = _.get(props, ['route', 'params', 'reportID']);
    const source = decodeURI(_.get(props, ['route', 'params', 'source']));

    /** This effects handles 2x cases when report attachments are opened with deep link */
    useEffect(() => {
        const report = ReportUtils.getReport(reportID);

        // Case 1 - if we are logged out and use the deep link for attachments and then login, then
        // the report will not have reportID yet, and we wouldn't have loaded report and report actions 
        // data yet. call openReport to get both report and report actions data
        if (!report.reportID) {
            Report.openReport(reportID);
            return;
        }

        if (!report.isLoadingReportActions) {
            // Case 2 - if we are already logged in and the report actions are not already loading and
            // report has no report actions, then we are on a page other than report screen. Now call
            // openReport to get report actions since we dont have them in onyx
            const reportActions = ReportActionUtils.getReportActions(report.reportID);
            if (_.isEmpty(reportActions)) {
                Report.openReport(reportID);
                return;
            }
        }
    }, [reportID]);

    return (
        <AttachmentModal
            allowDownload
            defaultOpen
            report={props.report}
            source={source}
            onModalHide={() => Navigation.dismissModal(reportID)}
            onCarouselAttachmentChange={(attachment) => {
                const route = ROUTES.getReportAttachmentRoute(reportID, attachment.source);
                Navigation.navigate(route);
            }}
        />
    );
}

ReportAttachments.propTypes = propTypes;
ReportAttachments.displayName = 'ReportAttachments';

export default withOnyx({
    report: {
        key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT}${getReportID(route)}`,
    },
})(ReportAttachments);

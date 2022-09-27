import PropTypes from 'prop-types';

export default PropTypes.shape({
    /** Name of the report */
    reportName: PropTypes.string,

    /** List of primarylogins of participants of the report */
    participants: PropTypes.arrayOf(PropTypes.string),

    /** List of icons for report participants */
    icons: PropTypes.arrayOf(PropTypes.string),

    /** ID of the report */
    reportID: PropTypes.string.isRequired,

    /** The largest sequenceNumber on this report */
    maxSequenceNumber: PropTypes.number,

    /** Whether there is an outstanding amount in IOU */
    hasOutstandingIOU: PropTypes.bool,

    /** Are we loading more report actions? */
    isLoadingMoreReportActions: PropTypes.bool,

    chatType: PropTypes.string,
    ownerEmail: PropTypes.string,
    policyID: PropTypes.string,
    isPinned: PropTypes.bool,
    lastVisitedTimestamp: PropTypes.number,
    lastReadSequenceNumber: PropTypes.number,
    lastMessageTimestamp: PropTypes.number,
    lastMessageText: PropTypes.string,
    lastActorEmail: PropTypes.string,
    notificationPreference: PropTypes.oneOf('mute', 'daily', 'always'),
    stateNum: PropTypes.number,
    statusNum: PropTypes.number,
    oldPolicyName: PropTypes.string,
    visibility: PropTypes.string,
    isOwnPolicyExpenseChat: PropTypes.bool,
    lastMessageHtml: PropTypes.string,
});

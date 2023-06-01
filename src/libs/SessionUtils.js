import lodashGet from 'lodash/get';

/**
 * Determine if the transitioning user is logging in as a new user.
 *
 * @param {String} transitionURL
 * @param {Number} sessionAccountID
 * @returns {Boolean}
 */
function isLoggingInAsNewUser(transitionURL, sessionAccountID) {
    // The OldDot mobile app does not URL encode the parameters, but OldDot web
    // does. We don't want to deploy OldDot mobile again, so as a work around we
    // compare the session email to both the decoded and raw email from the transition link.
    const params = new URLSearchParams(transitionURL);
    const paramsAccountID = params.get('accountID');

    // If the email param matches what is stored in the session then we are
    // definitely not logging in as a new user
    if (paramsAccountID === sessionAccountID.toString()) {
        return false;
    }

    // If they do not match it might be due to encoding, so check the raw value
    // Capture the un-encoded text in the email param
    const accountIDParamRegex = /[?&]accountID=([^&]*)/g;
    const matches = accountIDParamRegex.exec(transitionURL);
    const linkedAccountID = lodashGet(matches, 1, null);
    return linkedAccountID !== sessionAccountID.toString();
}

export {
    // eslint-disable-next-line import/prefer-default-export
    isLoggingInAsNewUser,
};

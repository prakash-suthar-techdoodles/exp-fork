import lodashGet from 'lodash/get';
import Onyx from 'react-native-onyx';
import _ from 'underscore';
import ONYXKEYS from '../../../ONYXKEYS';
import * as User from '../../actions/User';
import BaseAPICommandBlocking from './BaseAPICommandBlocking';
import CONST from '../../../CONST';
import Navigation from '../../Navigation/Navigation';
import ROUTES from '../../../ROUTES';

let isLoggedIn = nul;
Onyx.connect({
    key: ONYXKEYS.SESSION,
    callback: (val) => {
        const sessionAuthToken = lodashGet(val, 'authToken', '');
        isLoggedIn = !_.isEmpty(sessionAuthToken);
    },
});

let currentlyViewedReportID = '';
Onyx.connect({
    key: ONYXKEYS.CURRENTLY_VIEWED_REPORTID,
    callback: val => currentlyViewedReportID = val || '',
});

export default class extends BaseAPICommandBlocking {
    #commandName = 'ValidateEmail';

    #commandParameters = {};

    #requiredParameters = ['accountID', 'validateCode'];

    startBlocking() {
        super.startBlocking();
        Onyx.merge(ONYXKEYS.ACCOUNT, {...CONST.DEFAULT_ACCOUNT_DATA, loading: true});
    }

    finishBlocking() {
        super.finishBlocking();

        const redirectRoute = isLoggedIn ? ROUTES.getReportRoute(currentlyViewedReportID) : ROUTES.HOME;

        Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        Navigation.navigate(redirectRoute);
    }

    processDataChanged(changedData) {
        const {email} = changedData;

        if (isLoggedIn) {
            User.getUserDetails();
        } else {
            // Let the user know we've successfully validated their login
            const success = lodashGet(changedData, 'message', `Your secondary login ${email} has been validated.`);
            Onyx.merge(ONYXKEYS.ACCOUNT, {success});
        }
    }

    /**
     * @param {Number} accountID
     * @param {String} validateCode
     */
    makeRequest(accountID, validateCode) {
        super.makeRequest({accountID, validateCode});
    }
}

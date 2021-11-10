import Onyx from 'react-native-onyx';
import {beforeEach, jest, test} from '@jest/globals';
import * as API from '../../src/libs/API';
import HttpUtils from '../../src/libs/HttpUtils';
import waitForPromisesToResolve from '../utils/waitForPromisesToResolve';
import ONYXKEYS from '../../src/ONYXKEYS';
import {signInWithTestUser} from '../utils/TestHelper';

// Set up manual mocks for methods used in the actions so our test does not fail.
jest.mock('../../src/libs/Notification/PushNotification', () => ({
    // There is no need for a jest.fn() since we don't need to make assertions against it.
    register: () => {},
    deregister: () => {},
}));

// We are mocking this method so that we can later test to see if it was called and what arguments it was called with.
// We test HttpUtils.xhr() since this means that our API command turned into a network request and isn't only queued.
HttpUtils.xhr = jest.fn();

Onyx.init({
    keys: ONYXKEYS,
    registerStorageEventListener: () => {},
});

beforeEach(() => Onyx.clear().then(waitForPromisesToResolve));

test('Authenticate is called with saved credentials when a session expires', () => {
    // Given a test user and set of authToken with subscriptions to session and credentials
    const TEST_USER_LOGIN = 'test@testguy.com';
    const TEST_USER_ACCOUNT_ID = 1;
    const TEST_INITIAL_AUTH_TOKEN = 'initialAuthToken';
    const TEST_REFRESHED_AUTH_TOKEN = 'refreshedAuthToken';

    let credentials;
    Onyx.connect({
        key: ONYXKEYS.CREDENTIALS,
        callback: val => credentials = val,
    });

    let session;
    Onyx.connect({
        key: ONYXKEYS.SESSION,
        callback: val => session = val,
    });

    // When we sign in with the test user
    return signInWithTestUser(TEST_USER_ACCOUNT_ID, TEST_USER_LOGIN, 'Password1', TEST_INITIAL_AUTH_TOKEN)
        .then(() => {
            // Then our re-authentication credentials should be generated and our session data
            // have the correct information + initial authToken.
            expect(credentials.login).toBe(TEST_USER_LOGIN);
            expect(credentials.autoGeneratedLogin).not.toBeUndefined();
            expect(credentials.autoGeneratedPassword).not.toBeUndefined();
            expect(session.authToken).toBe(TEST_INITIAL_AUTH_TOKEN);
            expect(session.accountID).toBe(TEST_USER_ACCOUNT_ID);
            expect(session.email).toBe(TEST_USER_LOGIN);

            // At this point we have an authToken. To simulate it expiring we'll just make another
            // request and mock the response so it returns 407. Once this happens we should attempt
            // to Re-Authenticate with the stored credentials. Our next call will be to Authenticate
            // so we will mock that response with a new authToken and then verify that Onyx has our
            // data.
            HttpUtils.xhr

                // This will make the call to API.Get() below return with an expired session code
                .mockImplementationOnce(() => Promise.resolve({
                    jsonCode: 407,
                }))

                // The next call should be Authenticate since we are reauthenticating
                .mockImplementationOnce(() => Promise.resolve({
                    jsonCode: 200,
                    accountID: TEST_USER_ACCOUNT_ID,
                    authToken: TEST_REFRESHED_AUTH_TOKEN,
                    email: TEST_USER_LOGIN,
                }));

            // When we attempt to fetch the chatList via the API
            API.Get({returnValueList: 'chatList'});
            return waitForPromisesToResolve();
        })
        .then(() => {
            // Then it should fail and reauthenticate the user adding the new authToken to the session
            // data in Onyx
            expect(session.authToken).toBe(TEST_REFRESHED_AUTH_TOKEN);
        });
});

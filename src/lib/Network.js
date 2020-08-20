import _ from 'underscore';
import Ion from './Ion';
import CONFIG from '../CONFIG';
import IONKEYS from '../IONKEYS';
import ROUTES from '../ROUTES';
import Str from './Str';
import Guid from './Guid';
import {registerSocketEventCallback} from './Pusher/pusher';
import redirectToSignIn from './actions/ActionsSignInRedirect';
import NetInfo from './NetInfo';

let isAppOffline = false;

// Indicates if we're in the process of re-authenticating. When an API call returns jsonCode 407 indicating that the
// authToken expired, we set this to true, pause all API calls, re-authenticate, and then use the authToken fromm the
// response in the subsequent API calls
let reauthenticating = false;

// Queue for network requests so we don't lose actions done by the user while offline
const networkRequestQueue = [];


// Subscribe
NetInfo.addEventListener(connected => {
    Ion.merge(IONKEYS.NETWORK, {isOffline: !connected});
});

/**
 * Events that happen on the pusher socket are used to determine if the app is online or offline. The offline setting
 * is stored in Ion so the rest of the app has access to it.
 *
 * @params {string} eventName,
 * @params {object} data
 */
registerSocketEventCallback((eventName, data) => {
    console.log(eventName, data);
    let isCurrentlyOffline = false;
    switch (eventName) {
        case 'connected':
            isCurrentlyOffline = false;
            break;
        case 'disconnected':
            isCurrentlyOffline = true;
            break;
        case 'state_change':
            if (data.current === 'connecting' || data.current === 'unavailable') {
                isCurrentlyOffline = true;
            }
            break;
        default:
            break;
    }
    isAppOffline = isCurrentlyOffline;
    Ion.merge(IONKEYS.NETWORK, {isOffline: isCurrentlyOffline});
});

/**
 * Adds a request to networkRequestQueue
 *
 * @param {string} command
 * @param {mixed} data
 * @returns {Promise}
 */
function queueRequest(command, data) {
    return new Promise((resolve) => {
        // Add the write request to a queue of actions to perform
        networkRequestQueue.push({
            command,
            data,
            callback: resolve,
        });

        // Try to fire off the request as soon as it's queued so we don't add a delay to every queued command
        // eslint-disable-next-line no-use-before-define
        processNetworkRequestQueue();
    });
}

/**
 * Sets API data in the store when we make a successful "Authenticate"/"CreateLogin" request
 *
 * @param {object} data
 * @param {string} exitTo
 * @returns {Promise}
 */
function setSuccessfulSignInData(data, exitTo) {
    return Ion.multiSet({
        // The response from Authenticate includes requestID, jsonCode, etc
        // but we only care about setting these three values in Ion
        [IONKEYS.SESSION]: _.pick(data, 'authToken', 'accountID', 'email'),
        [IONKEYS.APP_REDIRECT_TO]: exitTo ? `/${exitTo}` : ROUTES.HOME,
        [IONKEYS.LAST_AUTHENTICATED]: new Date().getTime(),
    });
}

/**
 * Makes XHR request
 * @param {String} command the name of the API command
 * @param {Object} data parameters for the API command
 * @param {String} type HTTP request type (get/post)
 * @returns {Promise}
 */
function xhr(command, data, type = 'post') {
    return Ion.get(IONKEYS.SESSION, 'authToken')
        .then((authToken) => {
            const formData = new FormData();

            // If we're calling Authenticate we don't need an authToken, so let's not send "undefined"
            if (command !== 'Authenticate') {
                formData.append('authToken', authToken);
            }
            _.each(data, (val, key) => formData.append(key, val));
            return formData;
        })
        .then(formData => fetch(`${CONFIG.EXPENSIFY.API_ROOT}command=${command}`, {
            method: type,
            body: formData,
        })
            .then(response => response.json()))

        // This will catch any HTTP network errors (like 404s and such), not to be confused with jsonCode which this
        // does NOT catch
        .catch(() => {
            isAppOffline = true;
            Ion.merge(IONKEYS.NETWORK, {isOffline: true});

            // If the request failed, we need to put the request object back into the queue
            queueRequest(command, data);

            // Throw a new error to prevent any other `then()` in the promise chain from being triggered (until another
            // catch() happens
            throw new Error('API is offline');
        });
}

/**
 * Create login
 * @param {string} login
 * @param {string} password
 * @returns {Promise}
 */
function createLogin(login, password) {
    // We call createLogin after getting a successful response to the Authenticate request
    // so it's very unlikely that this will fail with 407 authToken expired which means we
    // won't need to replay this request and thus we can use xhr instead of request
    return xhr('CreateLogin', {
        partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
        partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
        partnerUserID: login,
        partnerUserSecret: password,
    })
        .then(() => Ion.set(IONKEYS.CREDENTIALS, {login, password}))
        .catch(err => Ion.merge(IONKEYS.SESSION, {error: err}));
}

/**
 * Makes an API request.
 *
 * For most API commands if we get a 407 jsonCode in the response, which means the authToken
 * expired, this function automatically makes an API call to Authenticate and get a fresh authToken, and retries the
 * original API command
 *
 * @param {string} command
 * @param {mixed} data
 * @param {string} [type]
 * @returns {Promise}
 */
function request(command, data, type = 'post') {
    // If we're in the process of re-authenticating, queue this request for after we're done re-authenticating
    if (reauthenticating) {
        return queueRequest(command, data);
    }

    // We treat Authenticate in a special way because unlike other commands, this one can't fail
    // with 407 authToken expired. When other api commands fail with this error we call Authenticate
    // to get a new authToken and then fire the original api command again
    if (command === 'Authenticate') {
        return xhr(command, data, type)
            .then((response) => {
                // If we didn't get a 200 response from authenticate and useExpensifyLogin != true, it means we're
                // trying to authenticate with the login credentials we created after the initial authentication, and
                // failing, so we need the user to sign in again with their expensify credentials again, which they can
                // do from the sign in page
                if (!command.useExpensifyLogin && response.jsonCode !== 200) {
                    return Ion.multiSet({
                        [IONKEYS.CREDENTIALS]: {},
                        [IONKEYS.SESSION]: {error: response.message},
                    })
                        .then(redirectToSignIn);
                }
                return setSuccessfulSignInData(response, data.exitTo);
            })
            .then((response) => {
                // If Expensify login, it's the users first time signing in and we need to
                // create a login for the user
                if (data.useExpensifyLogin) {
                    console.debug('[SIGNIN] Creating a login');
                    return createLogin(Str.generateDeviceLoginID(), Guid());
                }
                return response;
            });
    }

    // Make the http request, and if we get 407 jsonCode in the response,
    // re-authenticate to get a fresh authToken and make the original http request again
    return xhr(command, data, type)
        .then((responseData) => {
            if (!reauthenticating && responseData.jsonCode === 407 && data.doNotRetry !== true) {
                reauthenticating = true;
                return Ion.get(IONKEYS.CREDENTIALS)
                    .then(({login, password}) => xhr('Authenticate', {
                        useExpensifyLogin: false,
                        partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
                        partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
                        partnerUserID: login,
                        partnerUserSecret: password,
                        twoFactorAuthCode: ''
                    })
                        .then((response) => {
                            reauthenticating = false;
                            return setSuccessfulSignInData(response);
                        })
                        .then(() => xhr(command, data, type))
                        .catch(() => {
                            reauthenticating = false;
                            redirectToSignIn();
                            return Promise.reject();
                        }));
            }
            return responseData;
        });
}

/**
 * Process the networkRequestQueue by looping through the queue and attempting to make the requests
 */
function processNetworkRequestQueue() {
    if (isAppOffline) {
        // Two things will bring the app online again...
        // 1. Pusher reconnecting (see registerSocketEventCallback at the top of this file)
        // 2. Getting a 200 response back from the API (happens right below)

        // Make a simple request every second to see if the API is online again
        request('Get', {doNotRetry: true})
            .then(() => Ion.merge(IONKEYS.NETWORK, {isOffline: false}))
            .then(() => isAppOffline = false);
        return;
    }

    // Don't make any requests until we're done re-authenticating since we'll use the new authToken
    // from that response for the subsequent network requests
    if (reauthenticating || networkRequestQueue.length === 0) {
        return;
    }
    for (let i = 0; i < networkRequestQueue.length; i++) {
        // Take the request object out of the queue and make the request
        const queuedRequest = networkRequestQueue.shift();
        request(queuedRequest.command, queuedRequest.data)
            .then(queuedRequest.callback);
    }
}

// Process our write queue very often
setInterval(processNetworkRequestQueue, 1000);

export {
    request,
    queueRequest,
};

import _ from 'underscore';
import lodashGet from 'lodash.get';
import {Platform} from 'react-native';
import Config from 'react-native-config';
import getPlatform from './libs/getPlatform/index';

// Set default values to contributor friendly values to make development work out of the box without an .env file
let useNgrok = lodashGet(Config, 'USE_NGROK', 'false');
let expensifyCashURL = lodashGet(Config, 'URL_EXPENSIFY_CASH', 'https://expensify.cash/');
let expensifyURL = lodashGet(Config, 'EXPENSIFY_URL_COM', 'https://www.expensify.com/');
const ngrokURL = lodashGet(Config, 'NGROK_URL', null);
const useWebProxy = lodashGet(Config, 'USE_WEB_PROXY', 'false');
const expensifyComWithProxy = getPlatform() === 'web' && useWebProxy === 'true' ? '/' : expensifyURL;

// Let's make everyone's life just a bit easier
// by adding / to the end of any config URL's if it's not already present
if (_.isString(useNgrok) && !useNgrok.endsWith('/')) {
    useNgrok += '/';
}
if (_.isString(expensifyCashURL) && !expensifyCashURL.endsWith('/')) {
    expensifyCashURL += '/';
}
if (_.isString(expensifyURL) && !expensifyURL.endsWith('/')) {
    expensifyURL += '/';
}

// Ngrok helps us avoid many of our cross-domain issues with connecting to our API
// and is required for viewing images on mobile and for developing on android
// To enable, set the USE_NGROK value to true in .env and update the NGROK_URL
const expensifyURLRoot = useNgrok === 'true' && ngrokURL ? ngrokURL : expensifyComWithProxy;

export default {
    APP_NAME: 'ExpensifyCash',
    AUTH_TOKEN_EXPIRATION_TIME: 1000 * 60 * 90,
    EXPENSIFY: {
        URL_EXPENSIFY_COM: expensifyComWithProxy,
        URL_EXPENSIFY_CASH: expensifyCashURL,
        URL_API_ROOT: expensifyURLRoot,
        PARTNER_NAME: lodashGet(Config, 'EXPENSIFY_PARTNER_NAME', 'chat-expensify-com'),
        PARTNER_PASSWORD: lodashGet(Config, 'EXPENSIFY_PARTNER_PASSWORD', 'e21965746fd75f82bb66'),
    },
    // eslint-disable-next-line no-undef
    IS_IN_PRODUCTION: Platform.OS === 'web' ? process.env.NODE_ENV === 'production' : !__DEV__,
    PUSHER: {
        APP_KEY: lodashGet(Config, 'PUSHER_APP_KEY', '268df511a204fbb60884'),
        CLUSTER: 'mt1',
    },
    SITE_TITLE: 'Expensify.cash',
    FAVICON: {
        DEFAULT: 'favicon.png',
        UNREAD: 'favicon-unread.png'
    }
};

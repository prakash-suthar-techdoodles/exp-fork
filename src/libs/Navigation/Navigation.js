import _ from 'underscore';
import {Keyboard} from 'react-native';
import {DrawerActions, getPathFromState, StackActions} from '@react-navigation/native';
import Onyx from 'react-native-onyx';
import Log from '../Log';
import linkTo from './linkTo';
import ROUTES from '../../ROUTES';
import CustomActions from './CustomActions';
import ONYXKEYS from '../../ONYXKEYS';
import linkingConfig from './linkingConfig';
import navigationRef from './navigationRef';
import CONST from '../../CONST';

let resolveNavigationIsReadyPromise;
let navigationIsReadyPromise = new Promise((resolve) => {
    resolveNavigationIsReadyPromise = resolve;
});

let isLoggedIn = false;
Onyx.connect({
    key: ONYXKEYS.SESSION,
    callback: val => isLoggedIn = Boolean(val && val.authToken),
});

// This flag indicates that we're trying to deeplink to a report when react-navigation is not fully loaded yet.
// If true, this flag will cause the drawer to start in a closed state (which is not the default for small screens)
// so it doesn't cover the report we're trying to link to.
let didTapNotificationBeforeReady = false;

function setDidTapNotification() {
    if (navigationRef.isReady()) {
        return;
    }

    didTapNotificationBeforeReady = true;
}

/**
 * @param {String} methodName
 * @param {Object} params
 * @returns {Boolean}
 */
function canNavigate(methodName, params = {}) {
    if (navigationRef.isReady()) {
        return true;
    }

    Log.hmmm(`[Navigation] ${methodName} failed because navigation ref was not yet ready`, params);
    return false;
}

/**
 * Opens the LHN drawer.
 * @private
 */
function openDrawer() {
    if (!canNavigate('openDrawer')) {
        return;
    }

    navigationRef.current.dispatch(DrawerActions.openDrawer());
    Keyboard.dismiss();
}

/**
 * Close the LHN drawer.
 * @private
 */
function closeDrawer() {
    if (!canNavigate('closeDrawer')) {
        return;
    }

    navigationRef.current.dispatch(DrawerActions.closeDrawer());
}

/**
 * @param {Boolean} isSmallScreenWidth
 * @returns {String}
 */
function getDefaultDrawerState(isSmallScreenWidth) {
    if (didTapNotificationBeforeReady || !isSmallScreenWidth) {
        return CONST.DRAWER_STATUS.CLOSED;
    }

    // We define the drawer status when the user navigates to the web App.
    // If the user navigates to the Home route, we will open the drawer.
    // For note the initialRouteName is SCREENS.REPORT, so other than navigating to the Home route,
    // the user will fall back to the Report route and we close the drawer.
    const path = getPathFromState(navigationRef.current.getState(), linkingConfig.config);
    return path === ROUTES.ROOT ? CONST.DRAWER_STATUS.OPEN : CONST.DRAWER_STATUS.CLOSED;
}

/**
 * @private
 * @param {Boolean} shouldOpenDrawer
 */
function goBack(shouldOpenDrawer = true) {
    if (!canNavigate('goBack')) {
        return;
    }

    if (!navigationRef.current.canGoBack()) {
        Log.hmmm('[Navigation] Unable to go back');
        if (shouldOpenDrawer) {
            openDrawer();
        }
        return;
    }

    navigationRef.current.goBack();
}

/**
 * We navigate to the certains screens with a custom action so that we can preserve the browser history in web. react-navigation does not handle this well
 * and only offers a "mobile" navigation paradigm e.g. in order to add a history item onto the browser history stack one would need to use the "push" action.
 * However, this is not performant as it would keep stacking ReportScreen instances (which are quite expensive to render).
 * We're also looking to see if we have a participants route since those also have a reportID param, but do not have the problem described above and should not use the custom action.
 *
 * @param {String} route
 * @returns {Boolean}
 */
function isDrawerRoute(route) {
    const {reportID, isParticipantsRoute} = ROUTES.parseReportRouteParams(route);
    return reportID && !isParticipantsRoute;
}

/**
 * Main navigation method for redirecting to a route.
 * @param {String} route
 */
function navigate(route = ROUTES.HOME) {
    if (!canNavigate('navigate', {route})) {
        return;
    }

    if (route === ROUTES.HOME) {
        if (isLoggedIn) {
            openDrawer();
            return;
        }

        // If we're navigating to the signIn page while logged out, pop whatever screen is on top
        // since it's guaranteed that the sign in page will be underneath (since it's the initial route).
        navigationRef.current.dispatch(StackActions.pop());
        return;
    }

    if (isDrawerRoute(route)) {
        navigationRef.current.dispatch(CustomActions.pushDrawerRoute(route));
        return;
    }

    linkTo(navigationRef.current, route);
}

/**
 * Dismisses a screen presented modally and returns us back to the previous view.
 *
 * @param {Boolean} [shouldOpenDrawer]
 */
function dismissModal(shouldOpenDrawer = false) {
    if (!canNavigate('dismissModal')) {
        return;
    }

    const normalizedShouldOpenDrawer = _.isBoolean(shouldOpenDrawer)
        ? shouldOpenDrawer
        : false;

    CustomActions.navigateBackToRootDrawer();
    if (normalizedShouldOpenDrawer) {
        openDrawer();
    }
}

/**
 * Returns the current active route
 * @returns {String}
 */
function getActiveRoute() {
    return navigationRef.current && navigationRef.current.getCurrentRoute().name
        ? getPathFromState(navigationRef.current.getState(), linkingConfig.config)
        : '';
}

/**
 * Check whether the passed route is currently Active or not.
 *
 * Building path with getPathFromState since navigationRef.current.getCurrentRoute().path
 * is undefined in the first navigation.
 *
 * @param {String} routePath Path to check
 * @return {Boolean} is active
 */
function isActiveRoute(routePath) {
    // We remove First forward slash from the URL before matching
    return getActiveRoute().substring(1) === routePath;
}

/**
 * @returns {Promise}
 */
function isNavigationReady() {
    return navigationIsReadyPromise;
}

function setIsNavigationReady() {
    resolveNavigationIsReadyPromise();
}

function resetIsNavigationReady() {
    navigationIsReadyPromise = new Promise((resolve) => {
        resolveNavigationIsReadyPromise = resolve;
    });
}

export default {
    canNavigate,
    navigate,
    dismissModal,
    isActiveRoute,
    getActiveRoute,
    goBack,
    closeDrawer,
    getDefaultDrawerState,
    setDidTapNotification,
    isNavigationReady,
    setIsNavigationReady,
    resetIsNavigationReady,
};

export {
    navigationRef,
};

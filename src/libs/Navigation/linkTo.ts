import {getActionFromState} from '@react-navigation/core';
import type {NavigationAction, NavigationContainerRef, NavigationState, PartialState} from '@react-navigation/native';
import type {Writable} from 'type-fest';
import getShouldUseNarrowLayout from '@libs/getShouldUseNarrowLayout';
import {extractPolicyIDFromPath, getPathWithoutPolicyID} from '@libs/PolicyUtils';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import type {Route} from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import getActionsFromPartialDiff from './AppNavigator/getActionsFromPartialDiff';
import getPartialStateDiff from './AppNavigator/getPartialStateDiff';
import dismissModal from './dismissModal';
import getPolicyIDFromState from './getPolicyIDFromState';
import getStateFromPath from './getStateFromPath';
import getTopmostBottomTabRoute from './getTopmostBottomTabRoute';
import getTopmostCentralPaneRoute from './getTopmostCentralPaneRoute';
import getTopmostReportId from './getTopmostReportId';
import linkingConfig from './linkingConfig';
import getAdaptedStateFromPath from './linkingConfig/getAdaptedStateFromPath';
import getMatchingBottomTabRouteForState from './linkingConfig/getMatchingBottomTabRouteForState';
import getMatchingCentralPaneRouteForState from './linkingConfig/getMatchingCentralPaneRouteForState';
import replacePathInNestedState from './linkingConfig/replacePathInNestedState';
import type {NavigationRoot, RootStackParamList, StackNavigationAction, State} from './types';

type ActionPayloadParams = {
    screen?: string;
    params?: unknown;
    path?: string;
};

type ActionPayload = {
    params?: ActionPayloadParams;
};

/**
 * Motivation for this function is described in NAVIGATION.md
 *
 * @param action action generated by getActionFromState
 * @param state The root state
 * @returns minimalAction minimal action is the action that we should dispatch
 */
function getMinimalAction(action: NavigationAction, state: NavigationState): Writable<NavigationAction> {
    let currentAction: NavigationAction = action;
    let currentState: State | undefined = state;
    let currentTargetKey: string | undefined;

    while (currentAction.payload && 'name' in currentAction.payload && currentState?.routes[currentState.index ?? -1].name === currentAction.payload.name) {
        if (!currentState?.routes[currentState.index ?? -1].state) {
            break;
        }

        currentState = currentState?.routes[currentState.index ?? -1].state;
        currentTargetKey = currentState?.key;

        const payload = currentAction.payload as ActionPayload;

        // Creating new smaller action
        currentAction = {
            type: currentAction.type,
            payload: {
                name: payload?.params?.screen,
                params: payload?.params?.params,
                path: payload?.params?.path,
            },
            target: currentTargetKey,
        };
    }
    return currentAction;
}

// Because we need to change the type to push, we also need to set target for this action to the bottom tab navigator.
function getActionForBottomTabNavigator(
    action: StackNavigationAction,
    state: NavigationState<RootStackParamList>,
    policyID?: string,
    shouldNavigate?: boolean,
): Writable<NavigationAction> | undefined {
    const bottomTabNavigatorRoute = state.routes.at(0);

    if (!bottomTabNavigatorRoute || bottomTabNavigatorRoute.state === undefined || !action || action.type !== CONST.NAVIGATION.ACTION_TYPE.NAVIGATE) {
        return;
    }

    const params = action.payload.params as ActionPayloadParams;
    let payloadParams = params.params as Record<string, string | undefined>;
    const screen = params.screen;

    if (!payloadParams) {
        payloadParams = {policyID};
    } else if (!('policyID' in payloadParams && !!payloadParams?.policyID)) {
        payloadParams = {...payloadParams, policyID};
    }

    // Check if the current bottom tab is the same as the one we want to navigate to. If it is, we don't need to do anything.
    const bottomTabCurrentTab = getTopmostBottomTabRoute(state);
    const bottomTabParams = bottomTabCurrentTab?.params as Record<string, string | undefined>;

    // Verify if the policyID is different than the one we are currently on. If it is, we need to navigate to the new policyID.
    const isNewPolicy = bottomTabParams?.policyID !== payloadParams?.policyID;
    if (bottomTabCurrentTab?.name === screen && !shouldNavigate && !isNewPolicy) {
        return;
    }

    return {
        type: CONST.NAVIGATION.ACTION_TYPE.PUSH,
        payload: {
            name: screen,
            params: payloadParams,
        },
        target: bottomTabNavigatorRoute.state.key,
    };
}

function isModalNavigator(targetNavigator?: string) {
    return targetNavigator === NAVIGATORS.LEFT_MODAL_NAVIGATOR || targetNavigator === NAVIGATORS.RIGHT_MODAL_NAVIGATOR;
}

export default function linkTo(navigation: NavigationContainerRef<RootStackParamList> | null, path: Route, type?: string, isActiveRoute?: boolean) {
    if (!navigation) {
        throw new Error("Couldn't find a navigation object. Is your component inside a screen in a navigator?");
    }

    let root: NavigationRoot = navigation;
    let current: NavigationRoot | undefined;

    // Traverse up to get the root navigation
    // eslint-disable-next-line no-cond-assign
    while ((current = root.getParent())) {
        root = current;
    }
    const pathWithoutPolicyID = getPathWithoutPolicyID(`/${path}`) as Route;
    const rootState = navigation.getRootState() as NavigationState<RootStackParamList>;
    const stateFromPath = getStateFromPath(pathWithoutPolicyID) as PartialState<NavigationState<RootStackParamList>>;

    // Creating path with /w/ included if necessary.
    const extractedPolicyID = extractPolicyIDFromPath(`/${path}`);
    const policyIDFromState = getPolicyIDFromState(rootState);
    const policyID = extractedPolicyID ?? policyIDFromState;

    const isWorkspaceSettingsOpened = getTopmostBottomTabRoute(rootState as State<RootStackParamList>)?.name === SCREENS.WORKSPACE.INITIAL && path.includes('workspace');

    if (policyID && !isWorkspaceSettingsOpened) {
        // The stateFromPath doesn't include proper path if there is a policy passed with /w/id.
        // We need to replace the path in the state with the proper one.
        // To avoid this hacky solution we may want to create custom getActionFromState function in the future.
        replacePathInNestedState(stateFromPath, `/w/${policyID}${pathWithoutPolicyID}`);
    }

    const action: StackNavigationAction = getActionFromState(stateFromPath, linkingConfig.config);

    // If action type is different than NAVIGATE we can't change it to the PUSH safely
    if (action?.type === CONST.NAVIGATION.ACTION_TYPE.NAVIGATE) {
        const topmostCentralPaneRoute = getTopmostCentralPaneRoute(rootState);
        const topRouteName = rootState?.routes?.at(-1)?.name;
        const isTargetNavigatorOnTop = topRouteName === action.payload.name;

        // In case if type is 'FORCED_UP' we replace current screen with the provided. This means the current screen no longer exists in the stack
        if (type === CONST.NAVIGATION.TYPE.FORCED_UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the report screen and the top most navigator is different from the one we want to navigate - PUSH the new screen to the top of the stack
        } else if (
            action.payload.name === NAVIGATORS.CENTRAL_PANE_NAVIGATOR &&
            topmostCentralPaneRoute &&
            (topmostCentralPaneRoute.name !== SCREENS.REPORT || getTopmostReportId(rootState) !== getTopmostReportId(stateFromPath))
        ) {
            // We need to push a tab if the tab doesn't match the central pane route that we are going to push.
            const topmostBottomTabRoute = getTopmostBottomTabRoute(rootState);
            const matchingBottomTabRoute = getMatchingBottomTabRouteForState(stateFromPath, policyID);
            const isNewPolicyID =
                (topmostBottomTabRoute?.params as Record<string, string | undefined>)?.policyID !== (matchingBottomTabRoute?.params as Record<string, string | undefined>)?.policyID;
            if (topmostBottomTabRoute && (topmostBottomTabRoute.name !== matchingBottomTabRoute.name || isNewPolicyID)) {
                root.dispatch({
                    type: CONST.NAVIGATION.ACTION_TYPE.PUSH,
                    payload: matchingBottomTabRoute,
                });
            }

            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;

            // If the type is UP, we deeplinked into one of the RHP flows and we want to replace the current screen with the previous one in the flow
            // and at the same time we want the back button to go to the page we were before the deeplink
        } else if (type === CONST.NAVIGATION.TYPE.UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the ModalNavigator and the last route on the root navigator is not already opened ModalNavigator then push
        } else if (isModalNavigator(action.payload.name) && !isTargetNavigatorOnTop) {
            if (isModalNavigator(topRouteName)) {
                dismissModal(navigation);
            }
            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;

            // If this RHP has mandatory central pane and bottom tab screens defined we need to push them.
            const {adaptedState, metainfo} = getAdaptedStateFromPath(path, linkingConfig.config);
            if (adaptedState && (metainfo.isCentralPaneAndBottomTabMandatory || metainfo.isFullScreenNavigatorMandatory)) {
                const diff = getPartialStateDiff(rootState, adaptedState as State<RootStackParamList>, metainfo);
                const diffActions = getActionsFromPartialDiff(diff);
                for (const diffAction of diffActions) {
                    root.dispatch(diffAction);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        } else if (action.payload.name === NAVIGATORS.BOTTOM_TAB_NAVIGATOR) {
            // If path contains a policyID, we should invoke the navigate function
            const shouldNavigate = !!extractedPolicyID;
            const actionForBottomTabNavigator = getActionForBottomTabNavigator(action, rootState, policyID, shouldNavigate);

            if (!actionForBottomTabNavigator) {
                return;
            }

            root.dispatch(actionForBottomTabNavigator);

            // If the layout is wide we need to push matching central pane route to the stack.
            if (!getShouldUseNarrowLayout()) {
                // stateFromPath should always include bottom tab navigator state, so getMatchingCentralPaneRouteForState will be always defined.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const matchingCentralPaneRoute = getMatchingCentralPaneRouteForState(stateFromPath)!;
                if (matchingCentralPaneRoute && 'name' in matchingCentralPaneRoute) {
                    root.dispatch({
                        type: CONST.NAVIGATION.ACTION_TYPE.PUSH,
                        payload: {
                            name: NAVIGATORS.CENTRAL_PANE_NAVIGATOR,
                            params: {
                                screen: matchingCentralPaneRoute.name,
                                params: matchingCentralPaneRoute.params,
                            },
                        },
                    });
                }
            } else {
                // If the layout is small we need to pop everything from the central pane so the bottom tab navigator is visible.
                root.dispatch({
                    type: 'POP_TO_TOP',
                    target: rootState.key,
                });
            }
            return;
        }
    }

    if (action && 'payload' in action && action.payload && 'name' in action.payload && isModalNavigator(action.payload.name)) {
        const minimalAction = getMinimalAction(action, navigation.getRootState());
        if (minimalAction) {
            // There are situations where a route already exists on the current navigation stack
            // But we want to push the same route instead of going back in the stack
            // Which would break the user navigation history
            if (!isActiveRoute && type === CONST.NAVIGATION.ACTION_TYPE.PUSH) {
                minimalAction.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;
            }
            root.dispatch(minimalAction);
            return;
        }
    }

    if (action !== undefined) {
        root.dispatch(action);
    } else {
        root.reset(stateFromPath);
    }
}

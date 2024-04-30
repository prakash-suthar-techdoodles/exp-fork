/* eslint-disable @typescript-eslint/naming-convention */
import type * as NativeNavigation from '@react-navigation/native';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import {addSeconds, format, subMinutes} from 'date-fns';
import React from 'react';
import {Linking} from 'react-native';
import Onyx from 'react-native-onyx';
import type Animated from 'react-native-reanimated';
import * as Localize from '@libs/Localize';
import * as NumberUtils from '@libs/NumberUtils';
import * as Pusher from '@libs/Pusher/pusher';
import PusherConnectionManager from '@libs/PusherConnectionManager';
import * as AppActions from '@userActions/App';
import * as User from '@userActions/User';
import App from '@src/App';
import CONFIG from '@src/CONFIG';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import appSetup from '@src/setup';
import type Participant from '@src/types/onyx/Report';
import PusherHelper from '../utils/PusherHelper';
import * as TestHelper from '../utils/TestHelper';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';
import waitForBatchedUpdatesWithAct from '../utils/waitForBatchedUpdatesWithAct';

// We need a large timeout here as we are lazy loading React Navigation screens and this test is running against the entire mounted App
jest.setTimeout(50000);

jest.mock('../../src/libs/Notification/LocalNotification');
jest.mock('../../src/components/Icon/Expensicons');
jest.mock('../../src/components/ConfirmedRoute.tsx');

// Needed for: https://stackoverflow.com/questions/76903168/mocking-libraries-in-jest
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
    __esModule: true,
    default: {
        ignoreLogs: jest.fn(),
        ignoreAllLogs: jest.fn(),
    },
}));

jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual<typeof Animated>('react-native-reanimated/mock'),
    createAnimatedPropAdapter: jest.fn,
    useReducedMotion: jest.fn,
}));

/**
 * We need to keep track of the transitionEnd callback so we can trigger it in our tests
 */
let transitionEndCB: () => void;

type ListenerMock = {
    triggerTransitionEnd: () => void;
    addListener: jest.Mock;
};

/**
 * This is a helper function to create a mock for the addListener function of the react-navigation library.
 * The reason we need this is because we need to trigger the transitionEnd event in our tests to simulate
 * the transitionEnd event that is triggered when the screen transition animation is completed.
 *
 * P.S: This can't be moved to a utils file because Jest wants any external function to stay in the scope.
 *
 * @returns An object with two functions: triggerTransitionEnd and addListener
 */
const createAddListenerMock = (): ListenerMock => {
    const transitionEndListeners: Array<() => void> = [];
    const triggerTransitionEnd = () => {
        transitionEndListeners.forEach((transitionEndListener) => transitionEndListener());
    };

    const addListener: jest.Mock = jest.fn().mockImplementation((listener, callback) => {
        if (listener === 'transitionEnd') {
            transitionEndListeners.push(callback);
        }
        return () => {
            // eslint-disable-next-line rulesdir/prefer-underscore-method
            transitionEndListeners.filter((cb) => cb !== callback);
        };
    });

    return {triggerTransitionEnd, addListener};
};

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    const {triggerTransitionEnd, addListener} = createAddListenerMock();
    transitionEndCB = triggerTransitionEnd;

    const useNavigation = () =>
        ({
            navigate: jest.fn(),
            ...actualNav.useNavigation,
            getState: () => ({
                routes: [],
            }),
            addListener,
        } as typeof NativeNavigation.useNavigation);

    return {
        ...actualNav,
        useNavigation,
        getState: () => ({
            routes: [],
        }),
    } as typeof NativeNavigation;
});

beforeAll(() => {
    // In this test, we are generically mocking the responses of all API requests by mocking fetch() and having it
    // return 200. In other tests, we might mock HttpUtils.xhr() with a more specific mock data response (which means
    // fetch() never gets called so it does not need mocking) or we might have fetch throw an error to test error handling
    // behavior. But here we just want to treat all API requests as a generic "success" and in the cases where we need to
    // simulate data arriving we will just set it into Onyx directly with Onyx.merge() or Onyx.set() etc.
    // @ts-expect-error -- TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated
    global.fetch = TestHelper.getGlobalFetchMock();

    Linking.setInitialURL('https://new.expensify.com/');
    appSetup();

    // Connect to Pusher
    PusherConnectionManager.init();
    Pusher.init({
        appKey: CONFIG.PUSHER.APP_KEY,
        cluster: CONFIG.PUSHER.CLUSTER,
        authEndpoint: `${CONFIG.EXPENSIFY.DEFAULT_API_ROOT}api/AuthenticatePusher?`,
    });
});

async function navigateToSidebarOption(index: number): Promise<void> {
    const hintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
    const optionRows = screen.queryAllByAccessibilityHint(hintText);
    fireEvent(optionRows[index], 'press');
    await waitForBatchedUpdatesWithAct();
}

const REPORT_ID = '1';
const USER_A_ACCOUNT_ID = 1;
const USER_A_EMAIL = 'user_a@test.com';
const USER_B_ACCOUNT_ID = 2;
const USER_B_EMAIL = 'user_b@test.com';
const USER_C_ACCOUNT_ID = 3;
const USER_C_EMAIL = 'user_c@test.com';
const USER_D_ACCOUNT_ID = 4;
const USER_D_EMAIL = 'user_d@test.com';
const USER_E_ACCOUNT_ID = 5;
const USER_E_EMAIL = 'user_e@test.com';
const USER_F_ACCOUNT_ID = 6;
const USER_F_EMAIL = 'user_f@test.com';
const USER_G_ACCOUNT_ID = 7;
const USER_G_EMAIL = 'user_g@test.com';
const USER_H_ACCOUNT_ID = 8;
const USER_H_EMAIL = 'user_h@test.com';
let reportActionCreatedDate: string;
let reportAction2CreatedDate: string;

/**
 * Sets up a test with a logged in user. Returns the <App/> test instance.
 */
function signInAndGetApp(reportName = '', participantAccountIDs?: number[], participants: Record<number, Participant> = {}): Promise<void> {
    // Render the App and sign in as a test user.
    render(<App />);
    return waitForBatchedUpdatesWithAct()
        .then(async () => {
            await waitForBatchedUpdatesWithAct();
            const hintText = Localize.translateLocal('loginForm.loginForm');
            const loginForm = screen.queryAllByLabelText(hintText);
            expect(loginForm).toHaveLength(1);

            await act(async () => {
                await TestHelper.signInWithTestUser(USER_A_ACCOUNT_ID, USER_A_EMAIL, undefined, undefined, 'A');
            });
            return waitForBatchedUpdatesWithAct();
        })
        .then(() => {
            User.subscribeToUserEvents();
            return waitForBatchedUpdates();
        })
        .then(async () => {
            const TEN_MINUTES_AGO = subMinutes(new Date(), 10);
            reportActionCreatedDate = format(addSeconds(TEN_MINUTES_AGO, 30), CONST.DATE.FNS_DB_FORMAT_STRING);
            reportAction2CreatedDate = format(addSeconds(TEN_MINUTES_AGO, 60), CONST.DATE.FNS_DB_FORMAT_STRING);

            // Simulate setting an unread report and personal details
            await Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}${REPORT_ID}`, {
                reportID: REPORT_ID,
                reportName,
                lastReadTime: reportActionCreatedDate,
                lastVisibleActionCreated: reportAction2CreatedDate,
                lastMessageText: 'Test',
                groupChatAdminLogins: USER_A_EMAIL,
                participantAccountIDs,
                participants,
                lastActorAccountID: USER_B_ACCOUNT_ID,
                type: CONST.REPORT.TYPE.CHAT,
                chatType: CONST.REPORT.CHAT_TYPE.GROUP,
            });
            const createdReportActionID = NumberUtils.rand64().toString();
            await Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${REPORT_ID}`, {
                [createdReportActionID]: {
                    actionName: CONST.REPORT.ACTIONS.TYPE.CREATED,
                    automatic: false,
                    created: format(TEN_MINUTES_AGO, CONST.DATE.FNS_DB_FORMAT_STRING),
                    reportActionID: createdReportActionID,
                    message: [
                        {
                            style: 'strong',
                            text: '__FAKE__',
                            type: 'TEXT',
                        },
                        {
                            style: 'normal',
                            text: 'created this report',
                            type: 'TEXT',
                        },
                    ],
                },
            });

            await Onyx.merge(ONYXKEYS.PERSONAL_DETAILS_LIST, {
                [USER_A_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_A_EMAIL, USER_A_ACCOUNT_ID, 'A'),
                [USER_B_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_B_EMAIL, USER_B_ACCOUNT_ID, 'B'),
                [USER_C_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_C_EMAIL, USER_C_ACCOUNT_ID, 'C'),
                [USER_D_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_D_EMAIL, USER_D_ACCOUNT_ID, 'D'),
                [USER_E_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_E_EMAIL, USER_E_ACCOUNT_ID, 'E'),
                [USER_F_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_F_EMAIL, USER_F_ACCOUNT_ID, 'F'),
                [USER_G_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_G_EMAIL, USER_G_ACCOUNT_ID, 'G'),
                [USER_H_ACCOUNT_ID]: TestHelper.buildPersonalDetails(USER_H_EMAIL, USER_H_ACCOUNT_ID, 'H'),
            });

            // We manually setting the sidebar as loaded since the onLayout event does not fire in tests
            AppActions.setSidebarLoaded();
            return waitForBatchedUpdatesWithAct();
        });
}

/**
 * Tests for checking the group chat names at places like LHN, chat header, details page etc.
 * Note that limit of 5 names is only for the header.
 */
describe('Tests for group chat name', () => {
    afterEach(() => {
        jest.clearAllMocks();
        Onyx.clear();

        // Unsubscribe to pusher channels
        PusherHelper.teardown();
    });

    const participantAccountIDs4 = [USER_A_ACCOUNT_ID, USER_B_ACCOUNT_ID, USER_C_ACCOUNT_ID, USER_D_ACCOUNT_ID];
    const participants4 = {
        [USER_A_ACCOUNT_ID]: {hidden: false, role: 'admin'},
        [USER_B_ACCOUNT_ID]: {hidden: false, role: 'member'},
        [USER_C_ACCOUNT_ID]: {hidden: false, role: 'member'},
        [USER_D_ACCOUNT_ID]: {hidden: false, role: 'member'},
    };

    const participantAccountIDs8 = [...participantAccountIDs4, USER_E_ACCOUNT_ID, USER_F_ACCOUNT_ID, USER_F_ACCOUNT_ID, USER_G_ACCOUNT_ID];
    const participants8 = {
        ...participants4,
        [USER_E_ACCOUNT_ID]: {hidden: false, role: 'member'},
        [USER_F_ACCOUNT_ID]: {hidden: false, role: 'member'},
        [USER_G_ACCOUNT_ID]: {hidden: false, role: 'member'},
        [USER_H_ACCOUNT_ID]: {hidden: false, role: 'member'},
    };

    it('Should show correctly in LHN', () =>
        signInAndGetApp('A, B, C, D', participantAccountIDs4, participants4).then(() => {
            // Verify the sidebar links are rendered
            const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
            const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
            expect(sidebarLinks).toHaveLength(1);

            // Verify there is only one option in the sidebar
            const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
            const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
            expect(optionRows).toHaveLength(1);

            const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
            const displayNameText = screen.queryByLabelText(displayNameHintText);

            return waitFor(() => expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D'));
        }));

    it('Should show correctly in LHN when report name is not present', () =>
        signInAndGetApp('', participantAccountIDs4, participants4).then(() => {
            // Verify the sidebar links are rendered
            const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
            const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
            expect(sidebarLinks).toHaveLength(1);

            // Verify there is only one option in the sidebar
            const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
            const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
            expect(optionRows).toHaveLength(1);

            const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
            const displayNameText = screen.queryByLabelText(displayNameHintText);

            return waitFor(() => expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D'));
        }));

    it('Should show all 8 names in LHN when 8 participants are present', () =>
        signInAndGetApp('', participantAccountIDs8, participants8).then(() => {
            // Verify the sidebar links are rendered
            const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
            const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
            expect(sidebarLinks).toHaveLength(1);

            // Verify there is only one option in the sidebar
            const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
            const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
            expect(optionRows).toHaveLength(1);

            const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
            const displayNameText = screen.queryByLabelText(displayNameHintText);

            return waitFor(() => expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D, E, F, G, H'));
        }));

    it('Check if group name shows fine for report header', () =>
        signInAndGetApp('', participantAccountIDs4, participants4)
            .then(() => {
                // Verify the sidebar links are rendered
                const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
                const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
                expect(sidebarLinks).toHaveLength(1);

                // Verify there is only one option in the sidebar
                const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
                const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
                expect(optionRows).toHaveLength(1);

                const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
                const displayNameText = screen.queryByLabelText(displayNameHintText);

                expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D');

                return navigateToSidebarOption(0);
            })
            .then(waitForBatchedUpdates)
            .then(async () => {
                await act(() => transitionEndCB?.());
                const name = 'A, B, C, D';
                const displayNameTexts = screen.queryAllByLabelText(name);
                return waitFor(() => expect(displayNameTexts).toHaveLength(1));
            }));

    it('Should show only 5 names when there are 8 participants in the report header', () =>
        signInAndGetApp('', participantAccountIDs8, participants8)
            .then(() => {
                // Verify the sidebar links are rendered
                const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
                const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
                expect(sidebarLinks).toHaveLength(1);

                // Verify there is only one option in the sidebar
                const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
                const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
                expect(optionRows).toHaveLength(1);

                const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
                const displayNameText = screen.queryByLabelText(displayNameHintText);

                expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D, E, F, G, H');

                return navigateToSidebarOption(0);
            })
            .then(waitForBatchedUpdates)
            .then(async () => {
                await act(() => transitionEndCB?.());
                const name = 'A, B, C, D, E';
                const displayNameTexts = screen.queryAllByLabelText(name);
                return waitFor(() => expect(displayNameTexts).toHaveLength(1));
            }));

    it('Should show exact name in header when report name is available with 4 participants', () =>
        signInAndGetApp('Test chat', participantAccountIDs4, participants4)
            .then(() => {
                // Verify the sidebar links are rendered
                const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
                const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
                expect(sidebarLinks).toHaveLength(1);

                // Verify there is only one option in the sidebar
                const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
                const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
                expect(optionRows).toHaveLength(1);

                const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
                const displayNameText = screen.queryByLabelText(displayNameHintText);

                expect(displayNameText?.props?.children?.[0]).toBe('Test chat');

                return navigateToSidebarOption(0);
            })
            .then(waitForBatchedUpdates)
            .then(async () => {
                await act(() => transitionEndCB?.());
                const name = 'Test chat';
                const displayNameTexts = screen.queryAllByLabelText(name);
                return waitFor(() => expect(displayNameTexts).toHaveLength(1));
            }));

    it('Should show exact name in header when report name is available with 8 participants', () =>
        signInAndGetApp("Let's talk", participantAccountIDs8, participants8)
            .then(() => {
                // Verify the sidebar links are rendered
                const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
                const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
                expect(sidebarLinks).toHaveLength(1);

                // Verify there is only one option in the sidebar
                const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
                const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
                expect(optionRows).toHaveLength(1);

                const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
                const displayNameText = screen.queryByLabelText(displayNameHintText);

                expect(displayNameText?.props?.children?.[0]).toBe("Let's talk");

                return navigateToSidebarOption(0);
            })
            .then(waitForBatchedUpdates)
            .then(async () => {
                await act(() => transitionEndCB?.());
                const name = "Let's talk";
                const displayNameTexts = screen.queryAllByLabelText(name);
                return waitFor(() => expect(displayNameTexts).toHaveLength(1));
            }));

    it('Should show last message preview in LHN', () =>
        signInAndGetApp('A, B, C, D', participantAccountIDs4, participants4).then(() => {
            // Verify the sidebar links are rendered
            const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
            const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
            expect(sidebarLinks).toHaveLength(1);

            // Verify there is only one option in the sidebar
            const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
            const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
            expect(optionRows).toHaveLength(1);

            const lastChatHintText = Localize.translateLocal('accessibilityHints.lastChatMessagePreview');
            const lastChatText = screen.queryByLabelText(lastChatHintText);

            return waitFor(() => expect(lastChatText?.props?.children).toBe('B: Test'));
        }));

    it('Should sort the names before displaying', () =>
        signInAndGetApp('', [USER_E_ACCOUNT_ID, ...participantAccountIDs4], {
            [USER_E_ACCOUNT_ID]: {
                hidden: false,
                role: 'member',
            },
            ...participants4,
        }).then(() => {
            // Verify the sidebar links are rendered
            const sidebarLinksHintText = Localize.translateLocal('sidebarScreen.listOfChats');
            const sidebarLinks = screen.queryAllByLabelText(sidebarLinksHintText);
            expect(sidebarLinks).toHaveLength(1);

            // Verify there is only one option in the sidebar
            const optionRowsHintText = Localize.translateLocal('accessibilityHints.navigatesToChat');
            const optionRows = screen.queryAllByAccessibilityHint(optionRowsHintText);
            expect(optionRows).toHaveLength(1);

            const displayNameHintText = Localize.translateLocal('accessibilityHints.chatUserDisplayNames');
            const displayNameText = screen.queryByLabelText(displayNameHintText);

            return waitFor(() => expect(displayNameText?.props?.children?.[0]).toBe('A, B, C, D, E'));
        }));
});

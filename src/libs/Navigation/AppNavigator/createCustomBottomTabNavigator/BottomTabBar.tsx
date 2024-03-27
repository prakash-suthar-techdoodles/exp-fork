import {useNavigation, useNavigationState} from '@react-navigation/native';
import React, {useEffect, useMemo} from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import {PressableWithFeedback} from '@components/Pressable';
import Tooltip from '@components/Tooltip';
import useActiveWorkspace from '@hooks/useActiveWorkspace';
import useLocalize from '@hooks/useLocalize';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import * as Session from '@libs/actions/Session';
import getTopmostBottomTabRoute from '@libs/Navigation/getTopmostBottomTabRoute';
import Navigation from '@libs/Navigation/Navigation';
import navigationRef, {navigationSidebarRef} from '@libs/Navigation/navigationRef';
import type {RootStackParamList, State} from '@libs/Navigation/types';
import {getChatTabBrickRoad} from '@libs/WorkspacesSettingsUtils';
import BottomTabAvatar from '@pages/home/sidebar/BottomTabAvatar';
import BottomTabBarFloatingActionButton from '@pages/home/sidebar/BottomTabBarFloatingActionButton';
import variables from '@styles/variables';
import * as Welcome from '@userActions/Welcome';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SCREENS from '@src/SCREENS';

type PurposeForUsingExpensifyModalOnyxProps = {
    isLoadingApp: OnyxEntry<boolean>;
};
type PurposeForUsingExpensifyModalProps = PurposeForUsingExpensifyModalOnyxProps;

function BottomTabBar({isLoadingApp = false}: PurposeForUsingExpensifyModalProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {activeWorkspaceID} = useActiveWorkspace();

    useEffect(() => {
        const navigationState = navigationRef.getState() as State<RootStackParamList> | undefined;
        const routes = navigationState?.routes;
        const currentRoute = routes?.[navigationState?.index ?? 0];
        if (Boolean(currentRoute && currentRoute.name !== NAVIGATORS.BOTTOM_TAB_NAVIGATOR && currentRoute.name !== NAVIGATORS.CENTRAL_PANE_NAVIGATOR) || Session.isAnonymousUser()) {
            return;
        }

        Welcome.show(routes, () => Navigation.navigate(ROUTES.ONBOARD));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingApp]);

    const navigationState = navigationSidebarRef.isReady() ? navigationSidebarRef.getRootState() : undefined;

    const currentTabName = useMemo(() => {
        if (!navigationState) {
            return SCREENS.HOME;
        }
        const topmostBottomTabRoute = getTopmostBottomTabRoute(navigationState);

        return topmostBottomTabRoute?.name ?? SCREENS.HOME;
    }, [navigationState]);

    const chatTabBrickRoad = getChatTabBrickRoad(activeWorkspaceID);

    return (
        <View style={styles.bottomTabBarContainer}>
            <Tooltip text={translate('common.chats')}>
                <PressableWithFeedback
                    onPress={() => {
                        navigationSidebarRef.navigate(SCREENS.HOME);
                    }}
                    role={CONST.ROLE.BUTTON}
                    accessibilityLabel={translate('common.chats')}
                    wrapperStyle={styles.flex1}
                    style={styles.bottomTabBarItem}
                >
                    <View>
                        <Icon
                            src={Expensicons.ChatBubble}
                            fill={currentTabName === SCREENS.HOME ? theme.iconMenu : theme.icon}
                            width={variables.iconBottomBar}
                            height={variables.iconBottomBar}
                        />
                        {chatTabBrickRoad && (
                            <View style={styles.bottomTabStatusIndicator(chatTabBrickRoad === CONST.BRICK_ROAD_INDICATOR_STATUS.INFO ? theme.iconSuccessFill : theme.danger)} />
                        )}
                    </View>
                </PressableWithFeedback>
            </Tooltip>

            <BottomTabBarFloatingActionButton />
            <BottomTabAvatar isSelected={currentTabName === SCREENS.SETTINGS.ROOT} />
        </View>
    );
}

BottomTabBar.displayName = 'BottomTabBar';

export default withOnyx<PurposeForUsingExpensifyModalProps, PurposeForUsingExpensifyModalOnyxProps>({
    isLoadingApp: {
        key: ONYXKEYS.IS_LOADING_APP,
    },
})(BottomTabBar);

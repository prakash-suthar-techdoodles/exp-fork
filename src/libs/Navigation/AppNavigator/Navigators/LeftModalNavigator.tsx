import React, {useMemo} from 'react';
import {View} from 'react-native';
import NoDropZone from '@components/DragAndDrop/NoDropZone';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import ModalNavigatorScreenOptions from '@libs/Navigation/AppNavigator/ModalNavigatorScreenOptions';
import * as ModalStackNavigators from '@libs/Navigation/AppNavigator/ModalStackNavigators';
import createPlatformStackNavigator from '@libs/Navigation/PlatformStackNavigation/createPlatformStackNavigator';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {AuthScreensParamList, LeftModalNavigatorParamList} from '@libs/Navigation/types';
import type NAVIGATORS from '@src/NAVIGATORS';
import SCREENS from '@src/SCREENS';
import Overlay from './Overlay';

type LeftModalNavigatorProps = PlatformStackScreenProps<AuthScreensParamList, typeof NAVIGATORS.LEFT_MODAL_NAVIGATOR>;

const Stack = createPlatformStackNavigator<LeftModalNavigatorParamList>();

function LeftModalNavigator({navigation}: LeftModalNavigatorProps) {
    const styles = useThemeStyles();
    const {isSmallScreenWidth} = useWindowDimensions();
    const screenOptions = useMemo(() => ModalNavigatorScreenOptions(styles), [styles]);

    return (
        <NoDropZone>
            {!isSmallScreenWidth && (
                <Overlay
                    isModalOnTheLeft
                    onPress={navigation.goBack}
                />
            )}
            <View style={styles.LHPNavigatorContainer(isSmallScreenWidth)}>
                <Stack.Navigator screenOptions={screenOptions}>
                    <Stack.Screen
                        name={SCREENS.LEFT_MODAL.CHAT_FINDER}
                        component={ModalStackNavigators.ChatFinderModalStackNavigator}
                    />
                    <Stack.Screen
                        name={SCREENS.LEFT_MODAL.WORKSPACE_SWITCHER}
                        component={ModalStackNavigators.WorkspaceSwitcherModalStackNavigator}
                    />
                </Stack.Navigator>
            </View>
        </NoDropZone>
    );
}

LeftModalNavigator.displayName = 'LeftModalNavigator';

export default LeftModalNavigator;

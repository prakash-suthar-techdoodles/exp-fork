import {CardStyleInterpolators} from '@react-navigation/stack';
import type {PlatformStackNavigationOptions} from '@libs/Navigation/PlatformStackNavigation/types';
import type {ThemeStyles} from '@styles/index';

/**
 * Modal stack navigator screen options generator function
 * @param themeStyles - The styles object
 * @returns The screen options object
 */
const ModalNavigatorScreenOptions = (themeStyles: ThemeStyles): PlatformStackNavigationOptions => ({
    headerShown: false,
    animation: 'slide_from_left',
    webOnly: {
        cardStyle: themeStyles.navigationScreenCardStyle,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    },
});

export default ModalNavigatorScreenOptions;

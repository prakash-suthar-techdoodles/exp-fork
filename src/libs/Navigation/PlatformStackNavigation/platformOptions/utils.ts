import type {CommonStackNavigationOptions, PlatformStackNavigationOptions} from '@libs/Navigation/PlatformStackNavigation/types';

const getCommonNavigationOptions = (screenOptions: PlatformStackNavigationOptions | undefined): CommonStackNavigationOptions =>
    screenOptions === undefined ? {} : (({animation, keyboardHandlingEnabled, webOnly, nativeOnly, ...rest}: PlatformStackNavigationOptions) => rest)(screenOptions);

export default getCommonNavigationOptions;

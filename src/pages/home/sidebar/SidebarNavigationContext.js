import React, {useMemo, useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import CONST from '../../../CONST';
import Navigation from '../../../libs/Navigation/Navigation';
import GLOBAL_NAVIGATION_MAPPING from '../../../GLOBAL_NAVIGATION_MAPPING';
import SUB_NAVIGATION_MENU_MAPPING from '../../../SUB_NAVIGATION_MENU_MAPPING';

const propTypes = {
    /** Children to wrap. The part of app that should have acces to this context */
    children: PropTypes.node.isRequired,
};

const SidebarNavigationContext = React.createContext({
    selectedGlobalNavigationOption: undefined,
    selectedSubNavigationMenu: undefined,
    selectedSubNavigationOption: undefined,
    updateFromNavigationState: () => {},
});

const mapSubNavigationOptionToGlobalNavigationOption = (SubNavigationOption) =>
    _.findKey(GLOBAL_NAVIGATION_MAPPING, (globalNavigationOptions) => globalNavigationOptions.includes(SubNavigationOption));

const mapSubNavigationOptionToSubNavigationMenu = (SubNavigationOption) => _.findKey(SUB_NAVIGATION_MENU_MAPPING, (subNavigationMenu) => subNavigationMenu.includes(SubNavigationOption));

function SidebarNavigationContextProvider({children}) {
    const [selectedGlobalNavigationOption, setSelectedGlobalNavigationOption] = useState(CONST.GLOBAL_NAVIGATION_OPTION.CHATS);
    const [selectedSubNavigationOption, setSelectedSubNavigationOption] = useState();
    const [selectedSubNavigationMenu, setSelectedSubNavigationMenu] = useState();

    const updateFromNavigationState = useCallback((navigationState) => {
        const topmostCentralPaneRouteName = Navigation.getTopMostCentralPaneRouteName(navigationState);
        if (!topmostCentralPaneRouteName) {
            return;
        }

        setSelectedSubNavigationOption(topmostCentralPaneRouteName);
        setSelectedSubNavigationMenu(mapSubNavigationOptionToSubNavigationMenu(topmostCentralPaneRouteName));
        setSelectedGlobalNavigationOption(mapSubNavigationOptionToGlobalNavigationOption(topmostCentralPaneRouteName));
    }, []);

    const contextValue = useMemo(
        () => ({
            selectedGlobalNavigationOption,
            selectedSubNavigationOption,
            selectedSubNavigationMenu,
            updateFromNavigationState,
        }),
        [selectedGlobalNavigationOption, selectedSubNavigationMenu, selectedSubNavigationOption, updateFromNavigationState],
    );

    return <SidebarNavigationContext.Provider value={contextValue}>{children}</SidebarNavigationContext.Provider>;
}

SidebarNavigationContextProvider.propTypes = propTypes;

export {SidebarNavigationContextProvider, SidebarNavigationContext};

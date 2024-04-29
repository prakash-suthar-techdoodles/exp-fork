import React from 'react';
import ScreenWrapper from '@components/ScreenWrapper';
import Search from '@components/Search';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {CentralPaneNavigatorParamList} from '@libs/Navigation/types';
import type SCREENS from '@src/SCREENS';
import useCustomBackHandler from './useCustomBackHandler';

type SearchPageProps = PlatformStackScreenProps<CentralPaneNavigatorParamList, typeof SCREENS.SEARCH.CENTRAL_PANE>;

function SearchPage({route}: SearchPageProps) {
    useCustomBackHandler();

    return (
        <ScreenWrapper testID={SearchPage.displayName}>
            <Search query={route.params.query} />
        </ScreenWrapper>
    );
}

SearchPage.displayName = 'SearchPage';

export default SearchPage;

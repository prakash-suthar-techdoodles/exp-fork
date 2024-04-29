import {forwardRef, lazy, Suspense} from 'react';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useThemeStyles from '@hooks/useThemeStyles';
import type {MapViewHandle} from './MapViewTypes';
import PendingMapView from './PendingMapView';
import type {ComponentProps} from './types';

const MapViewImpl = lazy(() => import('./MapViewImpl.website'));

const MapView = forwardRef<MapViewHandle, ComponentProps>((props, ref) => {
    const {isOffline} = useNetwork();
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    return (
        <Suspense
            fallback={
                <PendingMapView
                    title={translate('distance.mapPending.title')}
                    subtitle={isOffline ? translate('distance.mapPending.subtitle') : translate('distance.mapPending.onlineSubtitle')}
                    style={styles.mapEditView}
                />
            }
        >
            <MapViewImpl
                // @ts-expect-error React.lazy loses type for ref.
                ref={ref}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        </Suspense>
    );
});

export default MapView;

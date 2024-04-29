import {lazy, Suspense} from 'react';
import type {PDFViewProps} from './types';

const PDFViewImpl = lazy(() => import('./PDFViewImpl'));

function PDFThumbnail(props: PDFViewProps) {
    return (
        <Suspense fallback={null}>
            <PDFViewImpl
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        </Suspense>
    );
}

export default PDFThumbnail;

import React, {lazy, Suspense} from 'react';
import type PDFThumbnailProps from './types';

const PDFThumbnailImpl = lazy(() => import('./PDFThumbnailImpl'));

function PDFThumbnail(props: PDFThumbnailProps) {
    return (
        <Suspense fallback={null}>
            <PDFThumbnailImpl
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        </Suspense>
    );
}

export default PDFThumbnail;

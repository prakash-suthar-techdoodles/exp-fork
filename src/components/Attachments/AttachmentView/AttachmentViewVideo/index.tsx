import React from 'react';
import VideoPlayer from '@components/VideoPlayer';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import type {AttachmentViewProps} from '..';

type AttachmentViewVideoProps = Pick<AttachmentViewProps, 'duration' | 'isHovered'> & {
    /** Video file source URL */
    source: string;

    shouldUseSharedVideoElement?: boolean;
};

function AttachmentViewVideo({source, isHovered = false, shouldUseSharedVideoElement = false, duration = 0}: AttachmentViewVideoProps) {
    const {isSmallScreenWidth} = useResponsiveLayout();
    const styles = useThemeStyles();

    return (
        <VideoPlayer
            url={source}
            shouldUseSharedVideoElement={shouldUseSharedVideoElement && !isSmallScreenWidth}
            isVideoHovered={isHovered}
            videoDuration={duration}
            style={[styles.w100, styles.h100]}
        />
    );
}

AttachmentViewVideo.displayName = 'AttachmentViewVideo';

export default React.memo(AttachmentViewVideo);

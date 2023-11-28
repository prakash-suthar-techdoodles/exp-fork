import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Keyboard, PixelRatio, View, ViewToken} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import BlockingView from '@components/BlockingViews/BlockingView';
import * as Illustrations from '@components/Icon/Illustrations';
import withLocalize from '@components/withLocalize';
import withWindowDimensions from '@components/withWindowDimensions';
import {WindowDimensionsProps} from '@components/withWindowDimensions/types';
import compose from '@libs/compose';
import * as DeviceCapabilities from '@libs/DeviceCapabilities';
import Navigation from '@libs/Navigation/Navigation';
import useThemeStyles from '@styles/useThemeStyles';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import AttachmentCarouselCellRenderer from './AttachmentCarouselCellRenderer';
import CarouselActions from './CarouselActions';
import CarouselButtons from './CarouselButtons';
import CarouselItem from './CarouselItem';
import extractAttachmentsFromReport from './extractAttachmentsFromReport';
import AttachmentCarouselProps, {Attachment, AttachmentCarouselOnyxProps, TransactionAttachmentCarouselOnyxProps} from './types';
import useCarouselArrows from './useCarouselArrows';

const viewabilityConfig = {
    // To facilitate paging through the attachments, we want to consider an item "viewable" when it is
    // more than 95% visible. When that happens we update the page index in the state.
    itemVisiblePercentThreshold: 95,
};

function AttachmentCarousel(props: AttachmentCarouselProps & WindowDimensionsProps) {
    const {report, reportActions, parentReportActions, source, onNavigate, setDownloadButtonVisibility, translate, transaction} = props;
    const styles = useThemeStyles();
    const scrollRef = useRef<FlatList>(null);

    const canUseTouchScreen = DeviceCapabilities.canUseTouchScreen();

    const [containerWidth, setContainerWidth] = useState(0);
    const [page, setPage] = useState<number | null>(0);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activeSource, setActiveSource] = useState<string | null>(source);
    const [shouldShowArrows, setShouldShowArrows, autoHideArrows, cancelAutoHideArrows] = useCarouselArrows();
    const [isReceipt, setIsReceipt] = useState(false);

    const compareImage = useCallback(
        (attachment: Attachment) => {
            if (attachment.isReceipt && isReceipt) {
                return attachment.transactionID === transaction?.transactionID;
            }
            return attachment.source === source;
        },
        [source, isReceipt, transaction],
    );

    useEffect(() => {
        const parentReportAction = parentReportActions?.[report?.parentReportActionID ?? ''] ?? null;
        const attachmentsFromReport = extractAttachmentsFromReport(parentReportAction, reportActions, transaction);

        const initialPage = attachmentsFromReport.findIndex(compareImage);

        // Dismiss the modal when deleting an attachment during its display in preview.
        if (initialPage === -1 && attachments.find(compareImage)) {
            Navigation.dismissModal(undefined);
        } else {
            setPage(initialPage);
            setAttachments(attachmentsFromReport);

            // Update the download button visibility in the parent modal
            setDownloadButtonVisibility(initialPage !== -1);

            // Update the parent modal's state with the source and name from the mapped attachments
            if (attachmentsFromReport[initialPage]) {
                onNavigate(attachmentsFromReport[initialPage]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportActions, parentReportActions, compareImage]);

    /**
     * Updates the page state when the user navigates between attachments
     */
    const updatePage = useCallback(
        ({viewableItems}: {viewableItems: ViewToken[]}) => {
            Keyboard.dismiss();

            // Since we can have only one item in view at a time, we can use the first item in the array
            // to get the index of the current page
            const entry = viewableItems[0];
            if (!entry) {
                setIsReceipt(false);
                setActiveSource(null);
                return;
            }

            setIsReceipt(entry.item.isReceipt);
            setPage(entry.index);
            setActiveSource(entry.item.source);

            onNavigate(entry.item);
        },
        [onNavigate],
    );

    /**
     * Increments or decrements the index to get another selected item
     */
    const cycleThroughAttachments = useCallback(
        (deltaSlide: number) => {
            const nextIndex = (page ?? 0) + deltaSlide;
            const nextItem = attachments[nextIndex];

            if (!nextItem || !scrollRef.current) {
                return;
            }

            scrollRef.current.scrollToIndex({index: nextIndex, animated: canUseTouchScreen});
        },
        [attachments, canUseTouchScreen, page],
    );

    /**
     * Calculate items layout information to optimize scrolling performance
     */
    const getItemLayout = useCallback(
        // eslint-disable-next-line @typescript-eslint/naming-convention
        (_: ArrayLike<Attachment> | null | undefined, index: number) => ({
            length: containerWidth,
            offset: containerWidth * index,
            index,
        }),
        [containerWidth],
    );

    /**
     * Defines how a single attachment should be rendered
     */
    const renderItem = useCallback(
        (renderItemProps: {item: Attachment}) => (
            <CarouselItem
                item={renderItemProps.item}
                isFocused={activeSource === renderItemProps.item.source}
                onPress={canUseTouchScreen ? () => setShouldShowArrows(!shouldShowArrows) : undefined}
            />
        ),
        [activeSource, canUseTouchScreen, setShouldShowArrows, shouldShowArrows],
    );

    return (
        <View
            style={[styles.flex1, styles.attachmentCarouselContainer]}
            onLayout={({nativeEvent}) => setContainerWidth(PixelRatio.roundToNearestPixel(nativeEvent.layout.width))}
            onMouseEnter={() => !canUseTouchScreen && setShouldShowArrows(true)}
            onMouseLeave={() => !canUseTouchScreen && setShouldShowArrows(false)}
        >
            {page === -1 ? (
                <BlockingView
                    icon={Illustrations.ToddBehindCloud}
                    iconWidth={variables.modalTopIconWidth}
                    iconHeight={variables.modalTopIconHeight}
                    title={translate('notFound.notHere')}
                />
            ) : (
                <>
                    <CarouselButtons
                        shouldShowArrows={shouldShowArrows}
                        page={page ?? 0}
                        attachments={attachments}
                        onBack={() => cycleThroughAttachments(-1)}
                        onForward={() => cycleThroughAttachments(1)}
                        autoHideArrow={autoHideArrows}
                        cancelAutoHideArrow={cancelAutoHideArrows}
                    />

                    {containerWidth > 0 && (
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            horizontal
                            decelerationRate="fast"
                            showsHorizontalScrollIndicator={false}
                            bounces={false}
                            // Scroll only one image at a time no matter how fast the user swipes
                            disableIntervalMomentum
                            pagingEnabled
                            snapToAlignment="start"
                            snapToInterval={containerWidth}
                            // Enable scrolling by swiping on mobile (touch) devices only
                            // disable scroll for desktop/browsers because they add their scrollbars
                            // Enable scrolling FlatList only when PDF is not in a zoomed state
                            scrollEnabled={canUseTouchScreen}
                            ref={scrollRef}
                            initialScrollIndex={page}
                            initialNumToRender={3}
                            windowSize={5}
                            maxToRenderPerBatch={CONST.MAX_TO_RENDER_PER_BATCH.CAROUSEL}
                            data={attachments}
                            CellRendererComponent={AttachmentCarouselCellRenderer}
                            renderItem={renderItem}
                            getItemLayout={getItemLayout}
                            keyExtractor={(item: Attachment) => String(item.source)}
                            viewabilityConfig={viewabilityConfig}
                            onViewableItemsChanged={updatePage}
                        />
                    )}

                    <CarouselActions onCycleThroughAttachments={cycleThroughAttachments} />
                </>
            )}
        </View>
    );
}

AttachmentCarousel.displayName = 'AttachmentCarousel';

export default compose(
    // eslint-disable-next-line rulesdir/no-multiple-onyx-in-file
    withOnyx<AttachmentCarouselProps, AttachmentCarouselOnyxProps>({
        reportActions: {
            key: ({report}) => `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report.reportID}`,
            canEvict: false,
        },
        parentReport: {
            key: ({report}) => `${ONYXKEYS.COLLECTION.REPORT}${report ? report.parentReportID : '0'}`,
        },
        parentReportActions: {
            key: ({report}) => `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report ? report.parentReportID : '0'}`,
            canEvict: false,
        },
    }),
    withWindowDimensions,
    // eslint-disable-next-line rulesdir/no-multiple-onyx-in-file
    withOnyx<AttachmentCarouselProps, TransactionAttachmentCarouselOnyxProps>({
        transaction: {
            key: ({report, parentReportActions}) => {
                const parentReportAction = parentReportActions?.[report?.parentReportActionID ?? ''];
                const originalMessage = parentReportAction?.actionName === CONST.REPORT.ACTIONS.TYPE.IOU ? parentReportAction?.originalMessage : null;
                return `${ONYXKEYS.COLLECTION.TRANSACTION}${originalMessage?.IOUTransactionID ?? 0}`;
            },
        },
    }),
    withLocalize,
)(AttachmentCarousel);

import React from 'react';

// This ref is created using React.createRef here because this function is used by a component that doesn't have access
// to the original ref.
const flatListRef = React.createRef();

/**
 * Scroll to the provided index.
 *
 * @param {Object} index
 */
function scrollToIndex(index) {
    flatListRef.current.scrollToIndex(index);
}

/**
 * Scroll to the bottom of the flatlist.
 *
 */
function scrollToBottom() {
    if (!flatListRef.current) {
        return;
    }

    flatListRef.current.scrollToOffset({animated: false, offset: 0});
}

/**
 * Ignore the scrolling on Native devices as currently they are not used.
 */

function isScrolling() {}
function setScrollingAndStartUnsetListener() {}
function setCurrentlyHoveredReportActionItem() {}

export {
    flatListRef,
    isScrolling,
    scrollToIndex,
    scrollToBottom,
    setScrollingAndStartUnsetListener,
    setCurrentlyHoveredReportActionItem,
};

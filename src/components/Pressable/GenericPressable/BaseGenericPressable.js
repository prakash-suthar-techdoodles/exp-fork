import React, {useCallback, useEffect, useMemo, forwardRef} from 'react';
// eslint-disable-next-line no-restricted-imports
import {Pressable} from 'react-native';
import _ from 'underscore';
import Accessibility from '../../../libs/Accessibility';
import HapticFeedback from '../../../libs/HapticFeedback';
import KeyboardShortcut from '../../../libs/KeyboardShortcut';
import * as Browser from '../../../libs/Browser';
import styles from '../../../styles/styles';
import genericPressablePropTypes from './PropTypes';
import CONST from '../../../CONST';
import * as StyleUtils from '../../../styles/StyleUtils';
import useSingleExecution from '../../../hooks/useSingleExecution';

/**
 * Returns the cursor style based on the role of Pressable
 * @param {Boolean} isText
 * @returns {Object}
 */
const getCursorStyle = (isText) => {
    if (isText) {
        return styles.cursorText;
    }

    return styles.cursorPointer;
};

const GenericPressable = forwardRef((props, ref) => {
    const {
        children,
        onPress,
        onLongPress,
        onKeyPress,
        disabled,
        style,
        shouldUseHapticsOnLongPress,
        shouldUseHapticsOnPress,
        nextFocusRef,
        keyboardShortcut,
        shouldUseAutoHitSlop,
        enableInScreenReaderStates,
        ...rest
    } = props;

    const {isExecuting, singleExecution} = useSingleExecution();
    const isScreenReaderActive = Accessibility.useScreenReaderStatus();
    const [hitSlop, onLayout] = Accessibility.useAutoHitSlop();

    const isDisabled = useMemo(() => {
        let shouldBeDisabledByScreenReader = false;
        if (enableInScreenReaderStates === CONST.SCREEN_READER_STATES.ACTIVE) {
            shouldBeDisabledByScreenReader = !isScreenReaderActive;
        }

        if (enableInScreenReaderStates === CONST.SCREEN_READER_STATES.DISABLED) {
            shouldBeDisabledByScreenReader = isScreenReaderActive;
        }

        return props.disabled || shouldBeDisabledByScreenReader || isExecuting;
    }, [isScreenReaderActive, enableInScreenReaderStates, props.disabled, isExecuting]);

    const onLongPressHandler = useCallback(
        (event) => {
            if (!onLongPress) {
                return;
            }
            if (shouldUseHapticsOnLongPress) {
                HapticFeedback.longPress();
            }
            if (ref && ref.current) {
                ref.current.blur();
            }
            onLongPress(event);

            Accessibility.moveAccessibilityFocus(nextFocusRef);
        },
        [shouldUseHapticsOnLongPress, onLongPress, nextFocusRef, ref, isDisabled],
    );

    const onPressHandler = useCallback(
        (event) => {
            if (!onPress) {
                return;
            }
            if (shouldUseHapticsOnPress) {
                HapticFeedback.press();
            }
            if (ref && ref.current) {
                ref.current.blur();
            }
            onPress(event);

            Accessibility.moveAccessibilityFocus(nextFocusRef);
        },
        [shouldUseHapticsOnPress, onPress, nextFocusRef, ref, isDisabled],
    );

    const onKeyPressHandler = useCallback(
        (event) => {
            if (event.key !== 'Enter') {
                return;
            }
            onPressHandler(event);
        },
        [onPressHandler],
    );

    useEffect(() => {
        if (!keyboardShortcut) {
            return () => {};
        }
        const {shortcutKey, descriptionKey, modifiers} = keyboardShortcut;
        return KeyboardShortcut.subscribe(shortcutKey, onPressHandler, descriptionKey, modifiers, true, false, 0, false);
    }, [keyboardShortcut, onPressHandler]);

    const defaultLongPressHandler = Browser.isMobileChrome() ? () => {} : undefined;
    return (
        <Pressable
            hitSlop={shouldUseAutoHitSlop ? hitSlop : undefined}
            onLayout={shouldUseAutoHitSlop ? onLayout : undefined}
            ref={ref}
            disabled={isDisabled}
            onPress={singleExecution(onPressHandler)}
            // In order to prevent haptic feedback, pass empty callback as onLongPress props. Please refer https://github.com/necolas/react-native-web/issues/2349#issuecomment-1195564240
            onLongPress={onLongPress ? onLongPressHandler : defaultLongPressHandler}
            onKeyPress={onKeyPressHandler}
            style={(state) => [
                getCursorStyle([props.accessibilityRole, props.role].includes('text')),
                StyleUtils.parseStyleFromFunction(props.style, state),
                isScreenReaderActive && StyleUtils.parseStyleFromFunction(props.screenReaderActiveStyle, state),
                state.focused && StyleUtils.parseStyleFromFunction(props.focusStyle, state),
                state.hovered && StyleUtils.parseStyleFromFunction(props.hoverStyle, state),
                state.pressed && StyleUtils.parseStyleFromFunction(props.pressStyle, state),
                isDisabled && [...StyleUtils.parseStyleFromFunction(props.disabledStyle, state), styles.noSelect],
            ]}
            // accessibility props
            accessibilityState={{
                disabled: isDisabled,
                ...props.accessibilityState,
            }}
            aria-disabled={isDisabled}
            aria-keyshortcuts={keyboardShortcut && `${keyboardShortcut.modifiers}+${keyboardShortcut.shortcutKey}`}
            // ios-only form of inputs
            onMagicTap={onPressHandler}
            onAccessibilityTap={onPressHandler}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
        >
            {(state) => (_.isFunction(props.children) ? props.children({...state, isScreenReaderActive, isDisabled}) : props.children)}
        </Pressable>
    );
});

GenericPressable.displayName = 'GenericPressable';
GenericPressable.propTypes = genericPressablePropTypes.pressablePropTypes;
GenericPressable.defaultProps = genericPressablePropTypes.defaultProps;

export default GenericPressable;

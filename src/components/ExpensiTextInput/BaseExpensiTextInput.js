import _ from 'underscore';
import React, {Component} from 'react';
import {
    Animated, TextInput, View, TouchableWithoutFeedback, Pressable,
} from 'react-native';
import Str from 'expensify-common/lib/str';
import ExpensiTextInputLabel from './ExpensiTextInputLabel';
import {propTypes, defaultProps} from './baseExpensiTextInputPropTypes';
import themeColors from '../../styles/themes/default';
import styles, {getIconFillColor} from '../../styles/styles';
import Icon from '../Icon';
import {
    Eye,
    EyeDisabled,
} from '../Icon/Expensicons';
import getButtonState from '../../libs/getButtonState';
import InlineErrorText from '../InlineErrorText';


const ACTIVE_LABEL_TRANSLATE_Y = -12;
const ACTIVE_LABEL_TRANSLATE_X = (translateX = -22) => translateX;
const ACTIVE_LABEL_SCALE = 0.8668;

const INACTIVE_LABEL_TRANSLATE_Y = 0;
const INACTIVE_LABEL_TRANSLATE_X = 0;
const INACTIVE_LABEL_SCALE = 1;

class BaseExpensiTextInput extends Component {
    constructor(props) {
        super(props);

        const hasValue = props.value && props.value.length > 0;

        this.state = {
            isFocused: false,
            labelTranslateY: new Animated.Value(hasValue ? ACTIVE_LABEL_TRANSLATE_Y : INACTIVE_LABEL_TRANSLATE_Y),
            labelTranslateX: new Animated.Value(hasValue
                ? ACTIVE_LABEL_TRANSLATE_X(props.translateX) : INACTIVE_LABEL_TRANSLATE_X),
            labelScale: new Animated.Value(hasValue ? ACTIVE_LABEL_SCALE : INACTIVE_LABEL_SCALE),
            passwordHidden: props.secureTextEntry,
        };

        this.input = null;
        this.value = hasValue ? props.value : '';
        this.isLabelActive = false;
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.setValue = this.setValue.bind(this);
        this.secureTextEntry = props.secureTextEntry;
    }

    componentDidMount() {
        // We are manually managing focus to prevent this issue: https://github.com/Expensify/App/issues/4514
        if (this.props.autoFocus && this.input) {
            this.input.focus();
        }
    }

    onFocus() {
        if (this.props.onFocus) { this.props.onFocus(); }
        this.setState({isFocused: true});
        this.activateLabel();
    }

    onBlur() {
        if (this.props.onBlur) { this.props.onBlur(); }
        this.setState({isFocused: false});
        this.deactivateLabel();
    }

    /**
     * Set Value & activateLabel
     *
     * @param {String} value
     * @memberof BaseExpensiTextInput
     */
    setValue(value) {
        this.value = value;
        Str.result(this.props.onChangeText, value);
        this.activateLabel();
    }

    activateLabel() {
        if (this.value.length >= 0 && !this.isLabelActive) {
            this.animateLabel(
                ACTIVE_LABEL_TRANSLATE_Y,
                ACTIVE_LABEL_TRANSLATE_X(this.props.translateX),
                ACTIVE_LABEL_SCALE,
            );
            this.isLabelActive = true;
        }
    }

    deactivateLabel() {
        if (this.value.length === 0) {
            this.animateLabel(INACTIVE_LABEL_TRANSLATE_Y, INACTIVE_LABEL_TRANSLATE_X, INACTIVE_LABEL_SCALE);
            this.isLabelActive = false;
        }
    }

    animateLabel(translateY, translateX, scale) {
        Animated.parallel([
            Animated.spring(this.state.labelTranslateY, {
                toValue: translateY,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(this.state.labelTranslateX, {
                toValue: translateX,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(this.state.labelScale, {
                toValue: scale,
                duration: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }

    togglePasswordVisibility() {
        this.setState(prevState => ({passwordHidden: !prevState.passwordHidden}));
    }


    render() {
        const {
            label,
            value,
            placeholder,
            errorText,
            hasError,
            containerStyles,
            inputStyle,
            ignoreLabelTranslateX,
            innerRef,
            autoFocus,
            multiline,
            secureTextEntry,
            ...inputProps
        } = this.props;

        const hasLabel = Boolean(label.length);
        return (
            <View>
                <View style={[!multiline && styles.componentHeightLarge, ...containerStyles]}>
                    <TouchableWithoutFeedback onPress={() => this.input.focus()} focusable={false}>
                        <View
                            style={[
                                styles.expensiTextInputContainer,
                                !hasLabel && styles.pv0,
                                this.state.isFocused && styles.borderColorFocus,
                                (hasError || errorText) && styles.borderColorDanger,
                            ]}
                        >
                            {hasLabel ? (
                                <ExpensiTextInputLabel
                                    label={label}
                                    labelTranslateX={
                                        ignoreLabelTranslateX
                                            ? new Animated.Value(0)
                                            : this.state.labelTranslateX
                                    }
                                    labelTranslateY={this.state.labelTranslateY}
                                    labelScale={this.state.labelScale}
                                />
                            ) : null}
                            <View style={styles.flexRow}>
                                <TextInput
                                    ref={(ref) => {
                                        if (typeof innerRef === 'function') { innerRef(ref); }
                                        this.input = ref;
                                    }}
                                    // eslint-disable-next-line
                                    {...inputProps}
                                    value={value}
                                    placeholder={(this.state.isFocused || !label) ? placeholder : null}
                                    placeholderTextColor={themeColors.placeholderText}
                                    underlineColorAndroid="transparent"
                                    style={[...inputStyle, styles.flex1, styles.pt3, !hasLabel && styles.pv0]}
                                    onFocus={this.onFocus}
                                    onBlur={this.onBlur}
                                    onChangeText={this.setValue}
                                    secureTextEntry={this.state.passwordHidden}
                                />
                                {secureTextEntry && (
                                    <Pressable
                                        accessibilityRole="button"
                                        style={[
                                            styles.secureInputEyeButton,
                                        ]}
                                        onPress={() => this.togglePasswordVisibility()}
                                    >
                                        {({hovered, pressed}) => (
                                            <Icon
                                                src={this.state.passwordHidden ? EyeDisabled : Eye}
                                                fill={getIconFillColor(getButtonState(hovered, pressed))}
                                            />
                                        )}
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
                {!_.isEmpty(errorText) && (
                    <InlineErrorText>
                        {errorText}
                    </InlineErrorText>
                )}
            </View>
        );
    }
}

BaseExpensiTextInput.propTypes = propTypes;
BaseExpensiTextInput.defaultProps = defaultProps;

export default BaseExpensiTextInput;

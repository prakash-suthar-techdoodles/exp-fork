import React from 'react';
import {Platform, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import RNTextInput from '../RNTextInput';
import themeColors from '../../styles/themes/default';
import CONST from '../../CONST';
import * as ComposerUtils from '../../libs/ComposerUtils';

const propTypes = {
    /** If the input should clear, it actually gets intercepted instead of .clear() */
    shouldClear: PropTypes.bool,

    /** A ref to forward to the text input */
    forwardedRef: PropTypes.func,

    /** When the input has cleared whoever owns this input should know about it */
    onClear: PropTypes.func,

    /** Set focus to this component the first time it renders.
     * Override this in case you need to set focus on one field out of many, or when you want to disable autoFocus */
    autoFocus: PropTypes.bool,

    /** Prevent edits and interactions like focus for this input. */
    isDisabled: PropTypes.bool,

    /** Selection Object */
    selection: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number,
    }),

    /** Whether the full composer can be opened */
    isFullComposerAvailable: PropTypes.bool,

    /** Allow the full composer to be opened */
    setIsFullComposerAvailable: PropTypes.func,

    /** Whether the composer is full size */
    isComposerFullSize: PropTypes.bool.isRequired,

    /** General styles to apply to the text input */
    // eslint-disable-next-line react/forbid-prop-types
    style: PropTypes.any,

    /** The text to display in the input */
    value: PropTypes.string,

    /** Called when the text gets changed by user input */
    onChangeText: PropTypes.func,

};

const defaultProps = {
    shouldClear: false,
    onClear: () => {},
    autoFocus: false,
    isDisabled: false,
    forwardedRef: null,
    selection: {
        start: 0,
        end: 0,
    },
    isFullComposerAvailable: false,
    setIsFullComposerAvailable: () => {},
    style: null,
    value: '',
    onChangeText: null,
};

class Composer extends React.Component {
    constructor(props) {
        super(props);

        this.onChangeText = this.onChangeText.bind(this);
        this.state = {
            propStyles: StyleSheet.flatten(this.props.style),
            value: props.value,
        };
    }

    componentDidMount() {
        // we pass the ref to the native view instance,
        // however, we want this method to be
        // available to be called from the outside as well.
        this.textInput.onChangeText = this.onChangeText;

        // This callback prop is used by the parent component using the constructor to
        // get a ref to the inner textInput element e.g. if we do
        // <constructor ref={el => this.textInput = el} /> this will not
        // return a ref to the component, but rather the HTML element by default
        if (!this.props.forwardedRef || !_.isFunction(this.props.forwardedRef)) {
            return;
        }

        this.props.forwardedRef(this.textInput);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.shouldClear || !this.props.shouldClear) {
            return;
        }

        this.textInput.clear();
        this.props.onClear();
    }

    onChangeText(text) {
        // updates the text input to reflect the current value
        this.setState({value: text});

        // calls the onChangeText callback prop
        if (this.props.onChangeText != null) {
            this.props.onChangeText(text);
        }
    }

    render() {
        // On native layers we like to have the Text Input not focused so the
        // user can read new chats without the keyboard in the way of the view.
        // On Android, the selection prop is required on the TextInput but this prop has issues on IOS
        // https://github.com/facebook/react-native/issues/29063
        const propsToPass = Platform.select({
            android: this.props,
            ios: _.omit(this.props, 'selection'),
        });
        return (
            <RNTextInput
                autoComplete="off"
                placeholderTextColor={themeColors.placeholderText}
                ref={el => this.textInput = el}
                maxHeight={this.props.isComposerFullSize ? '100%' : CONST.COMPOSER_MAX_HEIGHT}
                onContentSizeChange={e => ComposerUtils.updateNumberOfLines(this.props, e)}
                rejectResponderTermination={false}
                textAlignVertical="center"
                style={this.state.propStyles}
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...propsToPass}
                editable={!this.props.isDisabled}
                onChangeText={this.onChangeText}

                // we have a value explicitly set so the value can be changed imperatively
                // (needed e.g. when we are injecting emojis into the text view)
                value={this.state.value}
            />
        );
    }
}

Composer.propTypes = propTypes;
Composer.defaultProps = defaultProps;

export default React.forwardRef((props, ref) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <Composer {...props} forwardedRef={ref} />
));

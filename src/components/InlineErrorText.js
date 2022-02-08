import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/styles';
import Text from './Text';

const propTypes = {
    /** Text to display */
    children: PropTypes.string,

    /** Styling for inline error text */
    additionalStyles: PropTypes.oneOfType(PropTypes.array),
};

const defaultProps = {
    children: 'Error',
    additionalStyles: [],
};

const InlineErrorText = (props) => {
    if (_.isEmpty(props.children)) {
        return null;
    }

    return (
        <Text style={[...props.additionalStyles, styles.formError, styles.mt1]}>{props.children}</Text>
    );
};

InlineErrorText.propTypes = propTypes;
InlineErrorText.defaultProps = defaultProps;
InlineErrorText.displayName = 'InlineErrorText';
export default InlineErrorText;

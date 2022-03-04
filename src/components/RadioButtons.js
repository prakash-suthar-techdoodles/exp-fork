import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import RadioButtonWithLabel from './RadioButtonWithLabel';
import styles from '../styles/styles';

const propTypes = {
    /** List of choices to display via radio buttons */
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
    })).isRequired,

    /** Callback to fire when selecting a radio button */
    onPress: PropTypes.func.isRequired,
};

class RadioButtons extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            checkedValue: '',
        };
    }

    render() {
        return (
            <view>
                {_.map(this.props.items, item => (
                    <RadioButtonWithLabel
                        isChecked={item.value === this.state.checkedValue}
                        style={[styles.mb4, styles.mt4]}
                        onPress={() => {
                            this.setState({checkedValue: item.value});
                            return this.props.onPress(item.value);
                        }}
                        label={item.label}
                    />
                ))}
            </view>
        );
    }
}

RadioButtons.propTypes = propTypes;

export default RadioButtons;

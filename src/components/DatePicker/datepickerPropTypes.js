import PropTypes from 'prop-types';
import {
    propTypes as fieldPropTypes,
    defaultProps as defaultFieldPropTypes,
} from '../TextInput/baseTextInputPropTypes';

const propTypes = {
    ...fieldPropTypes,

    /**
     * The datepicker supports any value that `moment` can parse.
     * `onInputChange` would always be called with a Date (or null)
     */
    value: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),

    /**
     * The datepicker supports any defaultValue that `moment` can parse.
     * `onInputChange` would always be called with a Date (or null)
     */
    defaultValue: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),

    /** A minimum date of calendar to select */
    minDate: PropTypes.objectOf(Date),

    /** A maximum date of calendar to select */
    maxDate: PropTypes.objectOf(Date),

};

const defaultProps = {
    ...defaultFieldPropTypes,
    value: undefined,
};

export {propTypes, defaultProps};

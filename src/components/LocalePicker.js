import _ from 'underscore';
import React from 'react';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import compose from '../libs/compose';
import * as App from '../libs/actions/App';
import withLocalize, {withLocalizePropTypes} from './withLocalize';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';
import * as Localize from '../libs/Localize';
import Picker from './Picker';
import styles from '../styles/styles';

const propTypes = {
    /** Indicates which locale the user currently has selected */
    preferredLocale: PropTypes.string,

    /** Indicates size of a picker component and whether to render the label or not */
    size: PropTypes.oneOf(['normal', 'small']),

    ...withLocalizePropTypes,
};

const defaultProps = {
    preferredLocale: CONST.DEFAULT_LOCALE,
    size: 'normal',
};

const localesToLanguages = {
    default: {
        value: 'en',
        label: Localize.translate('en', 'languagePage.languages.en.label'),
    },
    es: {
        value: 'es',
        label: Localize.translate('es', 'languagePage.languages.es.label'),
    },
};

const LocalePicker = props => (
    <Picker
        label={props.size === 'normal' ? props.translate('languagePage.language') : null}
        onInputChange={(locale) => {
            if (locale === props.preferredLocale) {
                return;
            }

            App.setLocale(locale);
        }}
        items={_.values(localesToLanguages)}
        size={props.size}
        value={props.preferredLocale}
        containerStyles={props.size === 'small' ? [styles.pickerContainerSmall] : []}
    />
);

LocalePicker.defaultProps = defaultProps;
LocalePicker.propTypes = propTypes;
LocalePicker.displayName = 'LocalePicker';

export default compose(
    withLocalize,
    withOnyx({
        preferredLocale: {
            key: ONYXKEYS.NVP_PREFERRED_LOCALE,
        },
    }),
)(LocalePicker);

import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/styles';
import PressableWithoutFeedback from '../Pressable/PressableWithoutFeedback';
import withLocalize, {withLocalizePropTypes} from '../withLocalize';
import CONST from '../../CONST';
import * as Expensicons from '../Icon/Expensicons';

const propTypes = {
    /** The on press method */
    onPress: PropTypes.func,
    /** Which provider you are using to sign in */
    provider: PropTypes.string.isRequired,

    ...withLocalizePropTypes,
};

const defaultProps = {
    onPress: () => {},
};

const providerData = {
    [CONST.SIGN_IN_METHOD.APPLE]: {
        icon: Expensicons.AppleLogo,
        accessibilityLabel: 'common.signInWithApple'
    },
}

function IconButton({onPress, translate, provider}) {
    return (
        <PressableWithoutFeedback
            onPress={onPress}
            style={styles.signInIconButton}
            accessibilityRole="button"
            accessibilityLabel={translate(providerData[provider].accessibilityLabel)}
        >
            {providerData[provider].icon}
        </PressableWithoutFeedback>
    );
}

IconButton.displayName = 'IconButton';
IconButton.propTypes = propTypes;
IconButton.defaultProps = defaultProps;

export default withLocalize(IconButton);

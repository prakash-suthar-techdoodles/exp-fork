import React from 'react';
import {TextInput, View} from 'react-native';
import Onyx, {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import _ from 'underscore';
import styles from '../../styles/styles';
import themeColors from '../../styles/themes/default';
import Button from '../../components/Button';
import Text from '../../components/Text';
import ONYXKEYS from '../../ONYXKEYS';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../components/withWindowDimensions';
import compose from '../../libs/compose';
import canFocusInputOnScreenFocus from '../../libs/canFocusInputOnScreenFocus';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import getEmailKeyboardType from '../../libs/getEmailKeyboardType';
import {fetchAccountDetails} from '../../libs/actions/Session';

const propTypes = {
    /* Onyx Props */

    /** The details about the account that the user is signing in with */
    account: PropTypes.shape({

        /** Login of the account */
        login: PropTypes.string,

        /** An error message to display to the user */
        error: PropTypes.string,

        /** Success message to display when necessary */
        success: PropTypes.string,

        /** Whether or not a sign on form is loading (being submitted) */
        loading: PropTypes.bool,
    }),

    ...windowDimensionsPropTypes,

    ...withLocalizePropTypes,
};

const defaultProps = {
    account: {
        login: '',
    },
};

class LoginForm extends React.Component {
    constructor(props) {
        super(props);

        this.updateLogin = this.updateLogin.bind(this);
        this.validateAndSubmitForm = this.validateAndSubmitForm.bind(this);
        this.login = props.account.login;

        this.state = {
            formError: false,
        };
    }

    /**
     * Update the value of login in Onyx
     *
     * @param {String} newLogin
     */
    updateLogin(newLogin) {
        this.login = newLogin;
        Onyx.merge(ONYXKEYS.ACCOUNT, {login: newLogin});
    }

    /**
     * Check that all the form fields are valid, then trigger the submit callback
     */
    validateAndSubmitForm() {
        if (!this.login.trim()) {
            this.setState({formError: this.props.translate('loginForm.pleaseEnterEmailOrPhoneNumber')});
            return;
        }

        this.setState({
            formError: null,
        });

        // Check if this login has an account associated with it or not
        fetchAccountDetails(this.login);
    }

    render() {
        return (
            <>
                <View style={[styles.mt3]}>
                    <Text style={[styles.formLabel]}>{this.props.translate('loginForm.enterYourPhoneOrEmail')}</Text>
                    <TextInput
                        style={[styles.textInput]}
                        ref={this.login}
                        defaultValue={this.login}
                        autoCompleteType="email"
                        textContentType="username"
                        onChangeText={this.updateLogin}
                        onSubmitEditing={this.validateAndSubmitForm}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={getEmailKeyboardType()}
                        placeholder={this.props.translate('loginForm.phoneOrEmail')}
                        placeholderTextColor={themeColors.placeholderText}
                        autoFocus={canFocusInputOnScreenFocus()}
                    />
                </View>

                {this.state.formError && (
                    <Text style={[styles.formError]}>
                        {this.state.formError}
                    </Text>
                )}

                {!_.isEmpty(this.props.account.error) && (
                    <Text style={[styles.formError]}>
                        {this.props.account.error}
                    </Text>
                )}
                {!_.isEmpty(this.props.account.success) && (
                    <Text style={[styles.formSuccess]}>
                        {this.props.account.success}
                    </Text>
                )}
                <View style={[styles.mt5]}>
                    <Button
                        success
                        text={this.props.translate('common.continue')}
                        isLoading={this.props.account.loading}
                        onPress={this.validateAndSubmitForm}
                    />
                </View>

            </>
        );
    }
}

LoginForm.propTypes = propTypes;
LoginForm.defaultProps = defaultProps;

export default compose(
    withOnyx({
        account: {key: ONYXKEYS.ACCOUNT},
    }),
    withWindowDimensions,
    withLocalize,
)(LoginForm);

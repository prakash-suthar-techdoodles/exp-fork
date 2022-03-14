import lodashGet from 'lodash/get';
import React, {Component} from 'react';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import {ScrollView} from 'react-native';
import Str from 'expensify-common/lib/str';
import _ from 'underscore';
import HeaderWithCloseButton from '../components/HeaderWithCloseButton';
import Navigation from '../libs/Navigation/Navigation';
import ScreenWrapper from '../components/ScreenWrapper';
import * as PersonalDetails from '../libs/actions/PersonalDetails';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';
import styles from '../styles/styles';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import withLocalize, {withLocalizePropTypes} from '../components/withLocalize';
import compose from '../libs/compose';
import Button from '../components/Button';
import KeyboardAvoidingView from '../components/KeyboardAvoidingView';
import FixedFooter from '../components/FixedFooter';
import AvatarWithImagePicker from '../components/AvatarWithImagePicker';
import * as User from '../libs/actions/User';
import currentUserPersonalDetailsPropsTypes from './settings/Profile/currentUserPersonalDetailsPropsTypes';
import LoginUtil from '../libs/LoginUtil';
import * as WelcomeAction from '../libs/actions/WelcomeActions';

const propTypes = {
    /* Onyx Props */

    /** The personal details of the person who is logged in */
    myPersonalDetails: PropTypes.shape(currentUserPersonalDetailsPropsTypes),

    /** The details about the user that is signed in */
    user: PropTypes.shape({
        /** An error message to display to the user */
        error: PropTypes.string,
    }),

    /** The details about the user account */
    account: PropTypes.shape({
        /** Whether a secondary login request has been requested and not yet completed */
        loading: PropTypes.bool,
    }),

    ...withLocalizePropTypes,
};

const defaultProps = {
    myPersonalDetails: {},
    user: {
        loginList: [],
    },
    account: {
        loading: false,
    },
};

class ProfilePage extends Component {
    constructor(props) {
        super(props);

        this.submitForm = this.submitForm.bind(this);
        this.setFirstName = this.setFirstName.bind(this);
        this.setLastName = this.setLastName.bind(this);
        this.setSecondaryLogin = this.setSecondaryLogin.bind(this);

        this.firstName = '';
        this.isFirstNameValid = true;
        this.lastName = '';
        this.isLastNameValid = true;
        this.secondaryLogin = '';
        this.secondaryLoginError = '';
        this.isSecondayLoginValid = true;

        this.password = LoginUtil.getAndDestroyPassword();

        this.state = {
            showFormError: false,
            formType: '',
        };

        User.clearUserErrorMessage();
        User.clearAccountLoadingState();
    }

    componentDidMount() {
        const isSMSLogin = Str.isSMSLogin(this.props.credentials.login);
        const formType = isSMSLogin ? CONST.LOGIN_TYPE.EMAIL : CONST.LOGIN_TYPE.PHONE;
        this.setState({formType});
    }

    componentDidUpdate(prevProps) {
        const isSetSecondaryLoginResponseReady = prevProps.account.loading && !this.props.account.loading;
        if (!isSetSecondaryLoginResponseReady) {
            return;
        }

        this.secondaryLoginError = lodashGet(this.props.user, 'error', '');
        if (this.secondaryLoginError) {
            this.displayFormErrorMessage();
            return;
        }
        this.closeModal();
    }

    setFirstName(text) {
        this.hideErrorMessage();
        this.firstName = text;
        this.isFirstNameValid = this.didNameValid(text);
    }

    setLastName(text) {
        this.hideErrorMessage();
        this.lastName = text;
        this.isLastNameValid = this.didNameValid(text);
    }

    setSecondaryLogin(text) {
        this.hideErrorMessage();
        this.secondaryLoginError = '';
        this.secondaryLogin = text;
        this.isSecondaryLoginValid = text.length === 0 || this.didSecondaryLoginValid(text);
    }

    /**
     * Handle screen unmount
     */
    setNextWelcomeActionStep() {
        // Reset error message
        User.clearUserErrorMessage();
        User.clearAccountLoadingState();

        // Don't set current welcome step if current step isn't equal to welcome profile. Could be direct access to the page by url.
        if (WelcomeAction.getCurrentWelcomeStep() !== CONST.FIRST_TIME_NEW_EXPENSIFY_USER_STEP.WELCOME_PROFILE_SETTING) {
            return;
        }

        // Finish current welcome step and move to next step
        WelcomeAction.setOnyxWelcomeStep(CONST.FIRST_TIME_NEW_EXPENSIFY_USER_STEP.GLOBAL_CREATE_MENU);
    }

    didNameValid(name) {
        return _.isEmpty(name) || (name && name.length <= 50);
    }

    didSecondaryLoginValid() {
        if (_.isEmpty(this.secondaryLogin)) { return true; }
        if (this.state.formType === CONST.LOGIN_TYPE.PHONE) {
            const phoneLogin = LoginUtil.getPhoneNumberWithoutSpecialChars(this.secondaryLogin);
            return Str.isValidPhone(phoneLogin);
        }
        return Str.isValidEmail(this.secondaryLogin);
    }

    didFormValid() {
        const nameValid = this.didNameValid(this.firstName) && this.didNameValid(this.lastName);
        return (this.password ? nameValid && this.didSecondaryLoginValid(this.secondaryLogin) : nameValid);
    }

    displayFormErrorMessage() {
        if (this.state.showFormError) {
            return;
        }
        this.setState({showFormError: true});
    }

    hideErrorMessage() {
        if (!this.state.showFormError) {
            return;
        }
        this.setState({showFormError: false});
    }

    /**
     * Submit form to update personal details
     */
    submitForm() {
        if (this.props.account.loading) {
            return;
        }

        if (!this.didFormValid()) {
            this.displayFormErrorMessage();
            return;
        }

        if (this.firstName.trim().length + this.lastName.trim().length > 0) {
            PersonalDetails.setPersonalDetails({firstName: this.firstName.trim(), lastName: this.lastName.trim()}, false);
        }

        if (!this.password || this.secondaryLogin.trim().length === 0) {
            this.closeModal();
            return;
        }

        const login = this.state.formType === CONST.LOGIN_TYPE.PHONE
            ? LoginUtil.getPhoneNumberWithoutSpecialChars(this.secondaryLogin)
            : this.secondaryLogin;

        User.setSecondaryLogin(login, this.password);
    }

    closeModal() {
        Navigation.dismissModal(true);
    }

    render() {
        let secondaryLoginErrorMessage = '';
        if (this.state.showFormError) {
            if (this.secondaryLoginError) {
                secondaryLoginErrorMessage = this.secondaryLoginError;
            } else if (!this.isSecondaryLoginValid) {
                secondaryLoginErrorMessage = this.props.translate(this.state.formType === CONST.LOGIN_TYPE.PHONE
                    ? 'messages.errorMessageInvalidPhone'
                    : 'loginForm.error.invalidFormatEmailLogin');
            }
        }

        return (
            <ScreenWrapper
                onWillUnmount={this.setNextWelcomeActionStep}
            >
                <KeyboardAvoidingView>
                    <HeaderWithCloseButton
                        title={this.props.translate('common.welcome')}
                        onCloseButtonPress={this.closeModal}
                    />
                    <ScrollView style={styles.flex1} contentContainerStyle={styles.p5}>
                        <Text style={[styles.mb8, styles.mtn4]}>
                            {this.props.translate('welcomeProfilePage.formTitle')}
                        </Text>
                        <AvatarWithImagePicker
                            containerStyles={[styles.mt6]}
                            isUploading={this.props.myPersonalDetails.avatarUploading}
                            avatarURL={this.props.myPersonalDetails.avatar}
                            onImageSelected={PersonalDetails.setAvatar}
                            onImageRemoved={() => PersonalDetails.deleteAvatar(this.props.myPersonalDetails.login)}
                            // eslint-disable-next-line max-len
                            isUsingDefaultAvatar={this.props.myPersonalDetails.avatar.includes('/images/avatars/avatar')}
                            anchorPosition={styles.createMenuPositionProfile}
                            size={CONST.AVATAR_SIZE.LARGE}
                        />
                        <TextInput
                            containerStyles={[styles.mt6]}
                            label={this.props.translate('common.firstName')}
                            onChangeText={this.setFirstName}
                            errorText={(this.state.showFormError
                                && !this.isFirstNameValid
                                ? this.props.translate('personalDetails.error.firstNameLength') : '')}
                        />
                        <TextInput
                            containerStyles={[styles.mt6]}
                            label={this.props.translate('common.lastName')}
                            onChangeText={this.setLastName}
                            errorText={(this.state.showFormError
                                && !this.isLastNameValid
                                ? this.props.translate('personalDetails.error.lastNameLength') : '')}
                            onSubmitEditing={!this.password && this.submitForm}
                        />
                        {this.password && (
                            <TextInput
                                containerStyles={[styles.mt6]}
                                label={this.props.translate(this.state.formType === CONST.LOGIN_TYPE.PHONE
                                    ? 'common.phoneNumber'
                                    : 'profilePage.emailAddress')}
                                onChangeText={this.setSecondaryLogin}
                                keyboardType={this.state.formType === CONST.LOGIN_TYPE.PHONE
                                    ? CONST.KEYBOARD_TYPE.PHONE_PAD : undefined}
                                errorText={secondaryLoginErrorMessage}
                                onSubmitEditing={this.submitForm}
                                returnKeyType="done"
                            />
                        )}
                    </ScrollView>
                    <FixedFooter>
                        <Button
                            success
                            isLoading={this.props.account.loading}
                            onPress={this.submitForm}
                            style={[styles.w100]}
                            text={this.props.translate('common.getStarted')}
                            pressOnEnter
                        />
                    </FixedFooter>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }
}

ProfilePage.propTypes = propTypes;
ProfilePage.defaultProps = defaultProps;
ProfilePage.displayName = 'ProfilePage';

export default compose(
    withLocalize,
    withOnyx({
        credentials: {
            key: ONYXKEYS.CREDENTIALS,
        },
        myPersonalDetails: {
            key: ONYXKEYS.MY_PERSONAL_DETAILS,
        },
        account: {
            key: ONYXKEYS.ACCOUNT,
        },
        user: {
            key: ONYXKEYS.USER,
        },
    }),
)(ProfilePage);

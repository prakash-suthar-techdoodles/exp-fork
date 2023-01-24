import lodashGet from 'lodash/get';
import _ from 'underscore';
import React, {Component} from 'react';
import {View} from 'react-native';
import withCurrentUserPersonalDetails, {withCurrentUserPersonalDetailsPropTypes, withCurrentUserPersonalDetailsDefaultProps} from '../../../components/withCurrentUserPersonalDetails';
import ScreenWrapper from '../../../components/ScreenWrapper';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import ROUTES from '../../../ROUTES';
import Form from '../../../components/Form';
import ONYXKEYS from '../../../ONYXKEYS';
import CONST from '../../../CONST';
import * as ValidationUtils from '../../../libs/ValidationUtils';
import TextInput from '../../../components/TextInput';
import Text from '../../../components/Text';
import styles from '../../../styles/styles';
import Navigation from '../../../libs/Navigation/Navigation';
import * as PersonalDetails from '../../../libs/actions/PersonalDetails';
import compose from '../../../libs/compose';

const propTypes = {
    ...withLocalizePropTypes,
    ...withCurrentUserPersonalDetailsPropTypes,
};

const defaultProps = {
    ...withCurrentUserPersonalDetailsDefaultProps,
};

class DisplayNamePage extends Component {
    constructor(props) {
        super(props);

        this.validate = this.validate.bind(this);
        this.updateDisplayName = this.updateDisplayName.bind(this);
    }

    /**
     * Submit form to update user's first and last name (and display name)
     * @param {Object} values
     * @param {String} values.firstName
     * @param {String} values.lastName
     */
    updateDisplayName(values) {
        PersonalDetails.updateDisplayName(
            values.firstName.trim(),
            values.lastName.trim(),
        );
    }

    /**
     * @param {Object} values
     * @param {String} values.firstName
     * @param {String} values.lastName
     * @returns {Object} - An object containing the errors for each inputID
     */
    validate(values) {
        const errors = {};

        const firstNameValidation = ValidationUtils.isValidDisplayName('first name', values.firstName);
        const lastNameValidation = ValidationUtils.isValidDisplayName('last name', values.lastName);

        ValidationUtils.assignError(
            errors,
            'firstName',
            !_.isEmpty(firstNameValidation),
            firstNameValidation,
        );

        ValidationUtils.assignError(
            errors,
            'lastName',
            !_.isEmpty(lastNameValidation),
            lastNameValidation,
        );

        if (!_.isEmpty(errors)) {
            return errors;
        }

        // Check the character limit for first and last name
        const characterLimitError = ['personalDetails.error.characterLimit', {limit: CONST.FORM_CHARACTER_LIMIT}];
        const [hasFirstNameError, hasLastNameError] = ValidationUtils.doesFailCharacterLimitAfterTrim(
            CONST.FORM_CHARACTER_LIMIT,
            [values.firstName, values.lastName],
        );
        ValidationUtils.assignError(errors, 'firstName', hasFirstNameError, characterLimitError);
        ValidationUtils.assignError(errors, 'lastName', hasLastNameError, characterLimitError);

        return errors;
    }

    /**
     * @param {Object} errors
     * @param {String} errorKey
     * @param {Boolean} hasError
     * @param {Array<[phrase, variables]>} errorCopy
     * @returns {Object} - An object containing the errors for each inputID
     */
    assignError(errors, errorKey, hasError, errorCopy) {
        const validateErrors = errors;
        if (hasError) {
            validateErrors[errorKey] = this.props.translateLocal(...errorCopy);
        }
        return validateErrors;
    }

    render() {
        const currentUserDetails = this.props.currentUserPersonalDetails || {};

        return (
            <ScreenWrapper includeSafeAreaPaddingBottom={false}>
                <HeaderWithCloseButton
                    title={this.props.translate('displayNamePage.headerTitle')}
                    shouldShowBackButton
                    onBackButtonPress={() => Navigation.navigate(ROUTES.SETTINGS_PROFILE)}
                    onCloseButtonPress={() => Navigation.dismissModal(true)}
                />
                <Form
                    style={[styles.flexGrow1, styles.ph5]}
                    formID={ONYXKEYS.FORMS.DISPLAY_NAME_FORM}
                    validate={this.validate}
                    onSubmit={this.updateDisplayName}
                    submitButtonText={this.props.translate('common.save')}
                    enabledWhenOffline
                >
                    <Text style={[styles.mb6]}>
                        {this.props.translate('displayNamePage.isShownOnProfile')}
                    </Text>
                    <View style={styles.mb4}>
                        <TextInput
                            inputID="firstName"
                            name="fname"
                            label={this.props.translate('common.firstName')}
                            defaultValue={lodashGet(currentUserDetails, 'firstName', '')}
                            placeholder={this.props.translate('displayNamePage.john')}
                        />
                    </View>
                    <View>
                        <TextInput
                            inputID="lastName"
                            name="lname"
                            label={this.props.translate('common.lastName')}
                            defaultValue={lodashGet(currentUserDetails, 'lastName', '')}
                            placeholder={this.props.translate('displayNamePage.doe')}
                        />
                    </View>
                </Form>
            </ScreenWrapper>
        );
    }
}

DisplayNamePage.propTypes = propTypes;
DisplayNamePage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withCurrentUserPersonalDetails,
)(DisplayNamePage);

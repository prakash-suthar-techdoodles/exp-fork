import _ from 'underscore';
import React from 'react';
import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import {View} from 'react-native';
import HeaderWithCloseButton from '../components/HeaderWithCloseButton';
import ScreenWrapper from '../components/ScreenWrapper';
import Navigation from '../libs/Navigation/Navigation';
import * as BankAccounts from '../libs/actions/BankAccounts';
import withLocalize, {withLocalizePropTypes} from '../components/withLocalize';
import AddPlaidBankAccount from '../components/AddPlaidBankAccount';
import getPlaidOAuthReceivedRedirectURI from '../libs/getPlaidOAuthReceivedRedirectURI';
import compose from '../libs/compose';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import FormScrollView from '../components/FormScrollView';
import FormHelper from '../libs/FormHelper';
import * as ReimbursementAccount from '../libs/actions/ReimbursementAccount';
import TextInput from '../components/TextInput';
import canFocusInputOnScreenFocus from '../libs/canFocusInputOnScreenFocus/index.native';
import personalBankAccountPropTypes from '../components/personalBankAccountPropTypes';
import {withNetwork} from '../components/OnyxProvider';
import FormAlertWithSubmitButton from '../components/FormAlertWithSubmitButton';
import OfflineWithFeedback from '../components/OfflineWithFeedback';
import * as PaymentMethods from '../libs/actions/PaymentMethods';

const propTypes = {
    ...withLocalizePropTypes,
    personalBankAccount: personalBankAccountPropTypes,
};

const defaultProps = {
    personalBankAccount: {
        error: '',
        shouldShowSuccess: false,
    },
};

class AddPersonalBankAccountPage extends React.Component {
    constructor(props) {
        super(props);

        this.getErrorText = this.getErrorText.bind(this);
        this.clearError = this.clearError.bind(this);
        this.validate = this.validate.bind(this);
        this.submit = this.submit.bind(this);

        this.state = {
            password: '',
        };

        this.formHelper = new FormHelper({
            errorPath: 'personalBankAccount.errorFields',
            setErrors: errorFields => ReimbursementAccount.setPersonalBankAccountFormValidationErrorFields(errorFields),
        });

        this.errorTranslationKeys = {
            selectedBank: 'addPersonalBankAccountPage.plaidBankAccountRequired',
            password: 'addPersonalBankAccountPage.passwordRequired',
        };
    }

    /**
     * @returns {Object}
     */
    getErrors() {
        return this.formHelper.getErrors(this.props);
    }

    /**
     * @param {String} fieldName
     * @returns {String}
     */
    getErrorText(fieldName) {
        const errors = this.getErrors();
        if (!errors[fieldName]) {
            return '';
        }

        return this.props.translate(this.errorTranslationKeys[fieldName]);
    }

    /**
     * @param {String} path
     */
    clearError(path) {
        this.formHelper.clearError(this.props, path);
    }

    /**
     * @returns {Boolean}
     */
    validate() {
        const errors = {};
        if (_.isEmpty(lodashGet(this.props, 'plaidData.selectedPlaidBankAccount', {}))) {
            errors.selectedBank = true;
        }

        if (_.isEmpty(this.state.password)) {
            errors.password = true;
        }

        ReimbursementAccount.setPersonalBankAccountFormValidationErrorFields(errors);
        return _.isEmpty(errors);
    }

    submit() {
        PaymentMethods.clearPersonalBankAccountErrors();

        if (!this.validate()) {
            return;
        }

        BankAccounts.addPersonalBankAccount(this.props.plaidData.selectedPlaidBankAccount, this.state.password);
    }

    render() {
        const selectedPlaidBankAccount = lodashGet(this.props, 'plaidData.selectedPlaidBankAccount', {});
        const hasPlaidBankAccounts = !_.isEmpty(lodashGet(this.props, 'plaidData.bankAccounts'));

        return (
            <ScreenWrapper>
                <HeaderWithCloseButton
                    title={this.props.translate('bankAccount.addBankAccount')}
                    onCloseButtonPress={Navigation.goBack}
                    shouldShowBackButton
                    onBackButtonPress={Navigation.goBack}
                />
                <>
                    <FormScrollView>
                        <View style={[styles.mh5, styles.mb5, styles.flex1]}>
                            <AddPlaidBankAccount
                                onSelect={(params) => {
                                    this.clearError('selectedBank');
                                    BankAccounts.updatePlaidData({selectedPlaidBankAccount: params.selectedPlaidBankAccount});
                                }}
                                onExitPlaid={Navigation.goBack}
                                receivedRedirectURI={getPlaidOAuthReceivedRedirectURI()}
                                selectedPlaidAccountID={selectedPlaidBankAccount.plaidAccountID}
                                errorText={this.getErrors().selectedBank ? this.getErrorText('selectedBank') : ''}
                            />
                            {hasPlaidBankAccounts && (
                                <OfflineWithFeedback
                                    errors={lodashGet(this.props.personalBankAccount, 'errors', null)}
                                    onClose={PaymentMethods.clearPersonalBankAccountErrors}
                                >
                                    <View style={[styles.mb5]}>
                                        <TextInput
                                            label={this.props.translate('addPersonalBankAccountPage.enterPassword')}
                                            secureTextEntry
                                            value={this.state.password}
                                            autoCompleteType="password"
                                            textContentType="password"
                                            autoCapitalize="none"
                                            autoFocus={canFocusInputOnScreenFocus()}
                                            onChangeText={(text) => {
                                                this.setState({password: text});
                                                this.clearError('password');
                                            }}
                                            errorText={this.getErrorText('password')}
                                            hasError={this.getErrors().password}
                                        />
                                    </View>
                                </OfflineWithFeedback>
                            )}
                        </View>
                    </FormScrollView>
                    {hasPlaidBankAccounts && (
                        <FormAlertWithSubmitButton
                            isAlertVisible={!_.isEmpty(this.props.personalBankAccount.errorFields)}
                            buttonText={this.props.translate('common.saveAndContinue')}
                            onSubmit={this.submit}
                            enabledWhenOffline
                        />
                    )}
                </>
            </ScreenWrapper>
        );
    }
}

AddPersonalBankAccountPage.propTypes = propTypes;
AddPersonalBankAccountPage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withNetwork(),
    withOnyx({
        plaidData: {
            key: ONYXKEYS.PLAID_DATA,
        },
        personalBankAccount: {
            key: ONYXKEYS.PERSONAL_BANK_ACCOUNT,
        },
    }),
)(AddPersonalBankAccountPage);

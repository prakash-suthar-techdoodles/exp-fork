import _ from 'underscore';
import lodashGet from 'lodash/get';
import React from 'react';
import {View} from 'react-native';
import Str from 'expensify-common/lib/str';
import moment from 'moment';
import {withOnyx} from 'react-native-onyx';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import CONST from '../../CONST';
import * as BankAccounts from '../../libs/actions/BankAccounts';
import Navigation from '../../libs/Navigation/Navigation';
import Text from '../../components/Text';
import DatePicker from '../../components/DatePicker';
import TextInput from '../../components/TextInput';
import styles from '../../styles/styles';
import CheckboxWithLabel from '../../components/CheckboxWithLabel';
import TextLink from '../../components/TextLink';
import StatePicker from '../../components/StatePicker';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import * as ValidationUtils from '../../libs/ValidationUtils';
import * as LoginUtils from '../../libs/LoginUtils';
import compose from '../../libs/compose';
import ONYXKEYS from '../../ONYXKEYS';
import Picker from '../../components/Picker';
import * as ReimbursementAccountUtils from '../../libs/ReimbursementAccountUtils';
import reimbursementAccountPropTypes from './reimbursementAccountPropTypes';
import AddressForm from './AddressForm';
import Form from '../../components/Form';

const propTypes = {
    /** Bank account currently in setup */
    // eslint-disable-next-line react/no-unused-prop-types
    reimbursementAccount: reimbursementAccountPropTypes.isRequired,

    ...withLocalizePropTypes,
};

class CompanyStep extends React.Component {
    constructor(props) {
        super(props);

        this.submit = this.submit.bind(this);
        this.validate = this.validate.bind(this);

        this.defaultWebsite = lodashGet(props, 'user.isFromPublicDomain', false)
            ? 'https://'
            : `https://www.${Str.extractEmailDomain(props.session.email, '')}`;

        this.state = {
            addressStreet: ReimbursementAccountUtils.getDefaultStateForField(props, 'addressStreet'),
            addressCity: ReimbursementAccountUtils.getDefaultStateForField(props, 'addressCity'),
            addressState: ReimbursementAccountUtils.getDefaultStateForField(props, 'addressState'),
            addressZipCode: ReimbursementAccountUtils.getDefaultStateForField(props, 'addressZipCode'),
        };

        // Map a field to the key of the error's translation
        this.errorTranslationKeys = {
            companyName: 'bankAccount.error.companyName',
            companyPhone: 'bankAccount.error.phoneNumber',
            website: 'bankAccount.error.website',
            companyTaxID: 'bankAccount.error.taxID',
            incorporationDate: 'bankAccount.error.incorporationDate',
            incorporationDateFuture: 'bankAccount.error.incorporationDateFuture',
            incorporationType: 'bankAccount.error.companyType',
            hasNoConnectionToCannabis: 'bankAccount.error.restrictedBusiness',
            incorporationState: 'bankAccount.error.incorporationState',
        };

        this.getErrorText = inputKey => ReimbursementAccountUtils.getErrorText(this.props, this.errorTranslationKeys, inputKey);
        this.clearError = inputKey => ReimbursementAccountUtils.clearError(this.props, inputKey);
        this.clearErrors = inputKeys => ReimbursementAccountUtils.clearErrors(this.props, inputKeys);
        this.getErrors = () => ReimbursementAccountUtils.getErrors(this.props);
    }

    componentWillUnmount() {
        BankAccounts.resetReimbursementAccount();
    }

    /**
     * @param {Object} values - form input values passed by the Form component
     * @returns {Object}
     */
    validate(values) {
        const errors = {};
        const errorTexts = {};

        // if (!ValidationUtils.isValidAddress(this.state.addressStreet)) {
        //     errors.addressStreet = true;
        // }

        // if (!ValidationUtils.isValidZipCode(this.state.addressZipCode)) {
        //     errors.addressZipCode = true;
        // }

        if (!values.website || !ValidationUtils.isValidURL(values.website)) {
            errorTexts.website = this.getErrorText('website');
            errors.website = true;
        }

        if (!values.companyTaxID || !ValidationUtils.isValidTaxID(values.companyTaxID)) {
            errorTexts.companyTaxID = this.getErrorText('companyTaxID');
            errors.companyTaxID = true;
        }

        if (!values.incorporationDate || !ValidationUtils.isValidDate(values.incorporationDate)) {
            errorTexts.incorporationDate = this.getErrorText('incorporationDate');
            errors.incorporationDate = true;
        }

        if (!values.incorporationDate || !ValidationUtils.isValidPastDate(values.incorporationDate)) {
            errorTexts.incorporationDateFuture = this.getErrorText('incorporationDateFuture');
            errors.incorporationDateFuture = true;
        }

        if (!values.companyPhone || !ValidationUtils.isValidUSPhone(values.companyPhone, true)) {
            errorTexts.companyPhone = this.getErrorText('companyPhone');
            errors.companyPhone = true;
        }

        if (!values.hasNoConnectionToCannabis) {
            errorTexts.hasNoConnectionToCannabis = this.getErrorText('hasNoConnectionToCannabis');
            errors.hasNoConnectionToCannabis = true;
        }

        BankAccounts.setBankAccountFormValidationErrors(errors);

        return errorTexts;
    }

    submit(values) {
        const incorporationDate = moment(values.incorporationDate).format(CONST.DATE.MOMENT_FORMAT_STRING);
        BankAccounts.setupWithdrawalAccount({
            ...values,
            incorporationDate,
            companyTaxID: values.companyTaxID.replace(CONST.REGEX.NON_NUMERIC, ''),
            companyPhone: LoginUtils.getPhoneNumberWithoutUSCountryCodeAndSpecialChars(values.companyPhone),
        });
    }

    render() {
        const shouldDisableCompanyName = Boolean(this.props.achData.bankAccountID && this.props.achData.companyName);
        const shouldDisableCompanyTaxID = Boolean(this.props.achData.bankAccountID && this.props.achData.companyTaxID);

        return (
            <>
                <HeaderWithCloseButton
                    title={this.props.translate('companyStep.headerTitle')}
                    stepCounter={{step: 2, total: 5}}
                    shouldShowGetAssistanceButton
                    guidesCallTaskID={CONST.GUIDES_CALL_TASK_IDS.WORKSPACE_BANK_ACCOUNT}
                    shouldShowBackButton
                    onBackButtonPress={() => BankAccounts.goToWithdrawalAccountSetupStep(CONST.BANK_ACCOUNT.STEP.BANK_ACCOUNT)}
                    onCloseButtonPress={Navigation.dismissModal}
                />
                <Form
                    ref={el => this.form = el}
                    formID={ONYXKEYS.FORMS.COMPANY_STEP_FORM}
                    validate={this.validate}
                    onSubmit={this.submit}
                    submitButtonText={this.props.translate('common.saveAndContinue')}
                    style={[styles.mh5, styles.mb5]}
                >
                    <Text>{this.props.translate('companyStep.subtitle')}</Text>
                    <TextInput
                        label={this.props.translate('companyStep.legalBusinessName')}
                        inputID="companyName"
                        containerStyles={[styles.mt4]}
                        disabled={shouldDisableCompanyName}
                        defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'companyName')}
                    />
                    <AddressForm
                        streetTranslationKey="common.companyAddress"
                        values={{
                            street: this.state.addressStreet,
                            city: this.state.addressCity,
                            zipCode: this.state.addressZipCode,
                            state: this.state.addressState,
                        }}
                        errors={{
                            street: this.getErrors().addressStreet,
                            city: this.getErrors().addressCity,
                            zipCode: this.getErrors().addressZipCode,
                            state: this.getErrors().addressState,
                        }}
                        onFieldChange={(values) => {
                            const renamedFields = {
                                street: 'addressStreet',
                                state: 'addressState',
                                city: 'addressCity',
                                zipCode: 'addressZipCode',
                            };
                            const renamedValues = {};
                            _.each(values, (value, inputKey) => {
                                const renamedInputKey = lodashGet(renamedFields, inputKey, inputKey);
                                renamedValues[renamedInputKey] = value;
                            });
                            this.setValue(renamedValues);
                            this.clearErrors(_.keys(renamedValues));
                        }}
                    />
                    <TextInput
                        inputID="companyPhone"
                        label={this.props.translate('common.phoneNumber')}
                        containerStyles={[styles.mt4]}
                        keyboardType={CONST.KEYBOARD_TYPE.PHONE_PAD}
                        placeholder={this.props.translate('common.phoneNumberPlaceholder')}
                        defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'companyPhone')}
                    />
                    <TextInput
                        inputID="website"
                        label={this.props.translate('companyStep.companyWebsite')}
                        containerStyles={[styles.mt4]}
                        defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'website')}
                    />
                    <TextInput
                        inputID="companyTaxID"
                        label={this.props.translate('companyStep.taxIDNumber')}
                        containerStyles={[styles.mt4]}
                        keyboardType={CONST.KEYBOARD_TYPE.NUMBER_PAD}
                        disabled={shouldDisableCompanyTaxID}
                        placeholder={this.props.translate('companyStep.taxIDNumberPlaceholder')}
                        defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'companyTaxID')}
                    />
                    <View style={styles.mt4}>
                        <Picker
                            inputID="incorporationType"
                            label={this.props.translate('companyStep.companyType')}
                            items={_.map(this.props.translate('companyStep.incorporationTypes'), (label, value) => ({value, label}))}
                            placeholder={{value: '', label: '-'}}
                            defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'incorporationType')}
                        />
                    </View>
                    <View style={styles.mt4}>
                        <DatePicker
                            inputID="incorporationDate"
                            label={this.props.translate('companyStep.incorporationDate')}
                            placeholder={this.props.translate('companyStep.incorporationDatePlaceholder')}
                            maximumDate={new Date()}
                            defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'incorporationDate')}
                        />
                    </View>
                    <View style={styles.mt4}>
                        <StatePicker
                            inputID="incorporationState"
                            label={this.props.translate('companyStep.incorporationState')}
                            defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'incorporationState')}
                        />
                    </View>
                    <CheckboxWithLabel
                        inputID="hasNoConnectionToCannabis"
                        defaultValue={ReimbursementAccountUtils.getDefaultStateForField(this.props, 'hasNoConnectionToCannabis')}
                        LabelComponent={() => (
                            <>
                                <Text>{`${this.props.translate('companyStep.confirmCompanyIsNot')} `}</Text>
                                <TextLink
                                    // eslint-disable-next-line max-len
                                    href="https://community.expensify.com/discussion/6191/list-of-restricted-businesses"
                                >
                                    {`${this.props.translate('companyStep.listOfRestrictedBusinesses')}.`}
                                </TextLink>
                            </>
                        )}
                        style={[styles.mt4]}
                    />
                </Form>
            </>
        );
    }
}

CompanyStep.propTypes = propTypes;
export default compose(
    withLocalize,
    withOnyx({
        reimbursementAccount: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
        },
        reimbursementAccountDraft: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT_DRAFT,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
        user: {
            key: ONYXKEYS.USER,
        },
    }),
)(CompanyStep);

import React, {useState} from 'react';
import {View} from 'react-native';
import TextInput from '../components/TextInput';
import AddressSearch from '../components/AddressSearch';
import Form from '../components/Form';
import * as FormActions from '../libs/actions/FormActions';
import styles from '../styles/styles';
import DatePicker from '../components/DatePicker';
import CheckboxWithLabel from '../components/CheckboxWithLabel';
import Text from '../components/Text';

/**
 * We use the Component Story Format for writing stories. Follow the docs here:
 *
 * https://storybook.js.org/docs/react/writing-stories/introduction#component-story-format
 */
const story = {
    title: 'Components/Form',
    component: Form,
    subcomponents: {
        TextInput, DatePicker, AddressSearch, CheckboxWithLabel,
    },

};

const Template = (args) => {
    const [isChecked, setIsChecked] = useState(args.draftValues.checkbox);

    // Form consumes data from Onyx, so we initialize Onyx with the necessary data here
    FormActions.setIsSubmitting(args.formID, args.formState.isSubmitting);
    FormActions.setServerErrorMessage(args.formID, args.formState.serverErrorMessage);
    FormActions.setDraftValues(args.formID, args.draftValues);

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Form {...args}>
            <View>
                <TextInput
                    label="Routing number"
                    inputID="routingNumber"
                    isFormInput
                    shouldSaveDraft
                />
            </View>
            <TextInput
                label="Account number"
                inputID="accountNumber"
                containerStyles={[styles.mt4]}
                isFormInput
            />
            <DatePicker
                label="DOB"
                inputID="dob"
                isFormInput
                containerStyles={[styles.mt4]}
                shouldSaveDraft
            />
            <AddressSearch
                label="Street"
                inputID="street"
                containerStyles={[styles.mt4]}
                isFormInput
            />
            <CheckboxWithLabel
                inputID="checkbox"
                isChecked={isChecked}
                defaultValue={isChecked}
                style={[styles.mb4, styles.mt5]}
                onPress={() => { setIsChecked(prev => !prev); }}
                isFormInput
                shouldSaveDraft
                LabelComponent={() => (
                    <Text>I accept the Expensify Terms of Service</Text>
                )}
            />
        </Form>
    );
};

/**
 * Story to exhibit the native event handlers for TextInput in the Form Component
 * @param {Object} args
 * @returns {JSX}
 */
const WithNativeEventHandler = (args) => {
    const [log, setLog] = useState('');

    // Form consumes data from Onyx, so we initialize Onyx with the necessary data here
    FormActions.setIsSubmitting(args.formID, args.formState.isSubmitting);
    FormActions.setServerErrorMessage(args.formID, args.formState.serverErrorMessage);
    FormActions.setDraftValues(args.formID, args.draftValues);

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Form {...args}>
            <TextInput
                label="Routing number"
                inputID="routingNumber"
                onChangeText={setLog}
                isFormInput
                shouldSaveDraft
            />
            <Text>
                {`Entered routing number: ${log}`}
            </Text>
        </Form>
    );
};

// Arguments can be passed to the component by binding
// See: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Default = Template.bind({});
const Loading = Template.bind({});
const ServerError = Template.bind({});
const InputError = Template.bind({});

const defaultArgs = {
    formID: 'TestForm',
    submitButtonText: 'Submit',
    validate: (values) => {
        const errors = {};
        if (!values.routingNumber) {
            errors.routingNumber = 'Please enter a routing number';
        }
        if (!values.accountNumber) {
            errors.accountNumber = 'Please enter an account number';
        }
        if (!values.dob) {
            errors.dob = 'Please enter DOB';
        }
        if (!values.checkbox) {
            errors.checkbox = 'You must accept the Terms of Service to continue';
        }
        return errors;
    },
    onSubmit: (values) => {
        setTimeout(() => {
            alert(`Form submitted!\n\nInput values: ${JSON.stringify(values, null, 4)}`);
            FormActions.setIsSubmitting('TestForm', false);
        }, 1000);
    },
    formState: {
        isSubmitting: false,
        serverErrorMessage: '',
    },
    draftValues: {
        routingNumber: '00001',
        accountNumber: '1111222233331111',
        dob: '1999-04-02',
        checkbox: false,
    },
};

Default.args = defaultArgs;
Loading.args = {...defaultArgs, formState: {isSubmitting: true}};
ServerError.args = {...defaultArgs, formState: {isSubmitting: false, serverErrorMessage: 'There was an unexpected error. Please try again later.'}};
InputError.args = {
    ...defaultArgs,
    draftValues: {
        routingNumber: '', accountNumber: '', dob: '', checkbox: false,
    },
};
WithNativeEventHandler.args = {...defaultArgs, draftValues: {routingNumber: '', accountNumber: ''}};

export default story;
export {
    Default,
    Loading,
    ServerError,
    InputError,
    WithNativeEventHandler,
};

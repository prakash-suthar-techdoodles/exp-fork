import React, { useCallback, useEffect, useRef } from 'react';
import { View, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import setSelection from '../libs/setSelection';
import PropTypes from 'prop-types';
import _ from 'underscore';
import TextInput from '../components/TextInput';
import ScreenWrapper from '../components/ScreenWrapper';
import HeaderWithBackButton from '../components/HeaderWithBackButton';
import Form from '../components/Form';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import CONST from '../CONST';
import useLocalize from '../hooks/useLocalize';

const propTypes = {
    /** Transaction default merchant value */
    defaultMerchant: PropTypes.string.isRequired,

    /** Callback to fire when the Save button is pressed  */
    onSubmit: PropTypes.func.isRequired,
};

function EditRequestMerchantPage({ defaultMerchant, onSubmit }) {
    const { translate } = useLocalize();
    const merchantInputRef = useRef(null);
    const focusTimeoutRef = useRef(null);

    const validate = useCallback((value) => {
        const errors = {};

        if (_.isEmpty(value.merchant)) {
            errors.merchant = 'common.error.fieldRequired';
        }

        return errors;
    }, []);

    useFocusEffect(
        useCallback(() => {
            focusTimeoutRef.current = setTimeout(() => {
                if (merchantInputRef.current) {
                    merchantInputRef.current.focus();
                    setSelection(merchantInputRef.current, 0, defaultMerchant.length);
                }
                return () => {
                    if (!focusTimeoutRef.current) {
                        return;
                    }
                    clearTimeout(focusTimeoutRef.current);
                };
            }, CONST.ANIMATED_TRANSITION);
        }, []),
    );

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
            testID={EditRequestMerchantPage.displayName}
        >
            <HeaderWithBackButton title={translate('common.merchant')} />
            <Form
                style={[styles.flexGrow1, styles.ph5]}
                formID={ONYXKEYS.FORMS.MONEY_REQUEST_MERCHANT_FORM}
                onSubmit={onSubmit}
                validate={validate}
                submitButtonText={translate('common.save')}
                enabledWhenOffline
            >
                <View style={styles.mb4}>
                    <TextInput
                        inputID="merchant"
                        name="merchant"
                        defaultValue={defaultMerchant}
                        label={translate('common.merchant')}
                        accessibilityLabel={translate('common.merchant')}
                        accessibilityRole={CONST.ACCESSIBILITY_ROLE.TEXT}
                        ref={(e) => (merchantInputRef.current = e)}
                        selectTextOnFocus
                    />
                </View>
            </Form>
        </ScreenWrapper>
    );
}

EditRequestMerchantPage.propTypes = propTypes;
EditRequestMerchantPage.displayName = 'EditRequestMerchantPage';

export default EditRequestMerchantPage;

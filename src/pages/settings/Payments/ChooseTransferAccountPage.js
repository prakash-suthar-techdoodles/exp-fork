import React from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import Onyx from 'react-native-onyx';
import ROUTES from '../../../ROUTES';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Navigation from '../../../libs/Navigation/Navigation';
import styles from '../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import KeyboardAvoidingView from '../../../components/KeyboardAvoidingView/index';
import PaymentMethodList from './PaymentMethodList';
import ONYXKEYS from '../../../ONYXKEYS';

const propTypes = {
    ...withLocalizePropTypes,
};

class ChooseTransferAccountPage extends React.Component {
    constructor(props) {
        super(props);
        this.paymentMethodSelected = this.paymentMethodSelected.bind(this);
    }

    /**
     * Go back to TransferPage with the selected bank account
     *
     * @param {Object} nativeEvent
     * @param {String} account
     */
    paymentMethodSelected(nativeEvent, account) {
        if (account) {
            Onyx.merge(ONYXKEYS.WALLET_TRANSFER, {selectedAccountID: account});
            Navigation.navigate(ROUTES.SETTINGS_TRANSFER_BALANCE);
        }
    }

    render() {
        return (
            <ScreenWrapper>
                <KeyboardAvoidingView>
                    <HeaderWithCloseButton
                        title={this.props.translate('chooseTransferAccountPage.chooseAccount')}
                        shouldShowBackButton
                        onBackButtonPress={() => Navigation.goBack()}
                        onCloseButtonPress={() => Navigation.goBack()}
                    />
                    <ScrollView style={styles.flex1} contentContainerStyle={styles.pv5}>
                        <PaymentMethodList
                            onPress={this.paymentMethodSelected}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }
}

ChooseTransferAccountPage.propTypes = propTypes;
ChooseTransferAccountPage.displayName = 'ChooseTransferAccountPage';

export default withLocalize(ChooseTransferAccountPage);

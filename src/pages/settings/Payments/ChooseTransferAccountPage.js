import React from 'react';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import ROUTES from '../../../ROUTES';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Navigation from '../../../libs/Navigation/Navigation';
import styles from '../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import KeyboardAvoidingView from '../../../components/KeyboardAvoidingView/index';
import PaymentMethodList from './PaymentMethodList';
import ONYXKEYS from '../../../ONYXKEYS';
import compose from '../../../libs/compose';
import * as paymentPropTypes from './paymentPropTypes';
import * as PaymentMethods from '../../../libs/actions/PaymentMethods';
import * as PaymentUtils from '../../../libs/PaymentUtils';

const propTypes = {
    walletTransfer: paymentPropTypes.walletTransferPropTypes,

    ...withLocalizePropTypes,
};

const defaultProps = {
    walletTransfer: {},
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
        if (!account) {
            PaymentUtils.addPaymentMethodType(this.props.walletTransfer.filterPaymentMethodType);
            return;
        }
        PaymentMethods.updateWalletTransferData({selectedAccountID: account});
        Navigation.navigate(ROUTES.SETTINGS_TRANSFER_BALANCE);
    }

    render() {
        return (
            <ScreenWrapper>
                <KeyboardAvoidingView>
                    <HeaderWithCloseButton
                        title={this.props.translate('chooseTransferAccountPage.chooseAccount')}
                        shouldShowBackButton
                        onBackButtonPress={() => Navigation.goBack()}
                        onCloseButtonPress={() => Navigation.dismissModal()}
                    />
                    <View style={[styles.flex1, styles.pv5]}>
                        <PaymentMethodList
                            onPress={this.paymentMethodSelected}
                            enableSelection
                            filterType={this.props.walletTransfer.filterPaymentMethodType}
                            selectedAccountID={this.props.walletTransfer.selectedAccountID}
                        />
                    </View>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }
}

ChooseTransferAccountPage.propTypes = propTypes;
ChooseTransferAccountPage.defaultProps = defaultProps;
ChooseTransferAccountPage.displayName = 'ChooseTransferAccountPage';

export default compose(
    withLocalize,
    withOnyx({
        walletTransfer: {
            key: ONYXKEYS.WALLET_TRANSFER,
        },
    }),
)(ChooseTransferAccountPage);

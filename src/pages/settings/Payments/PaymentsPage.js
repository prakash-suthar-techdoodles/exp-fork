import React from 'react';
import Onyx, {withOnyx} from 'react-native-onyx';
import {ScrollView, View} from 'react-native';
import PropTypes from 'prop-types';
import PaymentMethodList from './PaymentMethodList';
import ROUTES from '../../../ROUTES';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Navigation from '../../../libs/Navigation/Navigation';
import styles from '../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import compose from '../../../libs/compose';
import KeyboardAvoidingView from '../../../components/KeyboardAvoidingView/index';
import Text from '../../../components/Text';
import {getPaymentMethods} from '../../../libs/actions/PaymentMethods';
import Popover from '../../../components/Popover';
import {PayPal, Transfer, CreditCard} from '../../../components/Icon/Expensicons';
import MenuItem from '../../../components/MenuItem';
import getClickedElementLocation from '../../../libs/getClickedElementLocation';
import CurrentWalletBalance from '../../../components/CurrentWalletBalance';
import ConfirmModal from '../../../components/ConfirmModal';
import ONYXKEYS from '../../../ONYXKEYS';
import {walletTransferPropTypes} from './paymentPropTypes';
import Permissions from '../../../libs/Permissions';

const PAYPAL = 'payPalMe';
const DEBIT_CARD = 'debitCard';

const propTypes = {
    walletTransfer: walletTransferPropTypes,

    /** List of betas available to current user */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** Are we loading payment methods? */
    isLoadingPaymentMethods: PropTypes.bool,

    /** Username for PayPal.Me */
    payPalMeUsername: PropTypes.string,

    ...withLocalizePropTypes,
};

const defaultProps = {
    walletTransfer: {
        completed: false,
    },
    betas: [],
    isLoadingPaymentMethods: true,
    payPalMeUsername: '',
};

class PaymentsPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            shouldShowAddPaymentMenu: false,
            anchorPositionTop: 0,
            anchorPositionLeft: 0,
        };

        this.paymentMethodPressed = this.paymentMethodPressed.bind(this);
        this.addPaymentMethodTypePressed = this.addPaymentMethodTypePressed.bind(this);
        this.hideAddPaymentMenu = this.hideAddPaymentMenu.bind(this);
        this.transferBalance = this.transferBalance.bind(this);
    }

    componentDidMount() {
        getPaymentMethods();
    }

    /**
     * Display the delete/default menu, or the add payment method menu
     *
     * @param {Object} nativeEvent
     * @param {String} account
     */
    paymentMethodPressed(nativeEvent, account) {
        if (account) {
            if (account === PAYPAL) {
                Navigation.navigate(ROUTES.SETTINGS_ADD_PAYPAL_ME);
            }
        } else {
            const position = getClickedElementLocation(nativeEvent);
            this.setState({
                shouldShowAddPaymentMenu: true,
                anchorPositionTop: position.bottom,

                // We want the position to be 20px to the right of the left border
                anchorPositionLeft: position.left + 20,
            });
        }
    }

    /**
     * Navigate to the appropriate payment type addition screen
     *
     * @param {String} paymentType
     */
    addPaymentMethodTypePressed(paymentType) {
        this.hideAddPaymentMenu();

        if (paymentType === PAYPAL) {
            Navigation.navigate(ROUTES.SETTINGS_ADD_PAYPAL_ME);
        }

        if (paymentType === DEBIT_CARD) {
            Navigation.navigate(ROUTES.SETTINGS_ADD_DEBIT_CARD);
        }
    }

    /**
     * Hide the add payment modal
     */
    hideAddPaymentMenu() {
        this.setState({shouldShowAddPaymentMenu: false});
    }

    /**
     * Transfer wallet balance
     */
    transferBalance() {
        Navigation.navigate(ROUTES.SETTINGS_TRANSFER_BALANCE);
    }

    render() {
        return (
            <ScreenWrapper>
                <KeyboardAvoidingView>
                    <HeaderWithCloseButton
                        title={this.props.translate('common.payments')}
                        shouldShowBackButton
                        onBackButtonPress={() => Navigation.navigate(ROUTES.SETTINGS)}
                        onCloseButtonPress={() => Navigation.dismissModal(true)}
                    />
                    <ScrollView style={styles.flex1}>
                        {Permissions.canUseWallet(this.props.betas) && (
                            <>
                                <View style={[styles.mv5]}>
                                    <CurrentWalletBalance />
                                </View>
                                <MenuItem
                                    title={this.props.translate('common.transferBalance')}
                                    icon={Transfer}
                                    onPress={this.transferBalance}
                                    shouldShowRightIcon
                                />
                            </>
                        )}
                        <Text
                            style={[styles.ph5, styles.formLabel]}
                        >
                            {this.props.translate('paymentsPage.paymentMethodsTitle')}
                        </Text>
                        <PaymentMethodList
                            onPress={this.paymentMethodPressed}
                            style={[styles.flex4]}
                            isLoadingPayments={this.props.isLoadingPaymentMethods}
                            isAddPaymentMenuActive={this.state.shouldShowAddPaymentMenu}
                        />
                    </ScrollView>
                    <Popover
                        isVisible={this.state.shouldShowAddPaymentMenu}
                        onClose={this.hideAddPaymentMenu}
                        anchorPosition={{
                            top: this.state.anchorPositionTop,
                            left: this.state.anchorPositionLeft,
                        }}
                    >
                        <View style={styles.pr15}>
                            {!this.props.payPalMeUsername && (
                                <MenuItem
                                    title={this.props.translate('common.payPalMe')}
                                    icon={PayPal}
                                    onPress={() => this.addPaymentMethodTypePressed(PAYPAL)}
                                />
                            )}
                            <MenuItem
                                title={this.props.translate('common.debitCard')}
                                icon={CreditCard}
                                onPress={() => this.addPaymentMethodTypePressed(DEBIT_CARD)}
                            />
                        </View>
                    </Popover>
                    <ConfirmModal
                        title={this.props.translate('paymentsPage.allSet')}
                        onConfirm={() => Onyx.set(ONYXKEYS.WALLET_TRANSFER, null)}
                        isVisible={this.props.walletTransfer.completed}
                        prompt={this.props.translate('paymentsPage.transferConfirmText', {
                            amount: this.props.numberFormat(
                                this.props.walletTransfer.transferAmount,
                                {style: 'currency', currency: 'USD'},
                            ),
                        })}
                        confirmText={this.props.translate('paymentsPage.gotIt')}
                        shouldShowCancelButton={false}
                    />
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }
}

PaymentsPage.propTypes = propTypes;
PaymentsPage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        walletTransfer: {
            key: ONYXKEYS.WALLET_TRANSFER,
        },
        betas: {
            key: ONYXKEYS.BETAS,
        },
        isLoadingPaymentMethods: {
            key: ONYXKEYS.IS_LOADING_PAYMENT_METHODS,
            initWithStoredValues: false,
        },
        payPalMeUsername: {
            key: ONYXKEYS.NVP_PAYPAL_ME_ADDRESS,
        },
    }),
)(PaymentsPage);

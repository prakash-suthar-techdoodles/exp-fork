import React, {Component} from 'react';
import {View, ActivityIndicator, ScrollView} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import _ from 'underscore';
import styles from '../../styles/styles';
import ONYXKEYS from '../../ONYXKEYS';
import themeColors from '../../styles/themes/default';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import Navigation from '../../libs/Navigation/Navigation';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import {payIOUReport} from '../../libs/actions/IOU';
import {fetchIOUReportByID} from '../../libs/actions/Report';
import ReportActionItemIOUPreview from '../../components/ReportActionItemIOUPreview';
import iouTransactionPropTypes from './iouTransactionPropTypes';
import IOUTransactions from './IOUTransactions';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import compose from '../../libs/compose';
import CONST from '../../CONST';
import CreateMenu from '../../components/CreateMenu';
import isAppInstalled from '../../libs/isAppInstalled';

const propTypes = {
    /** URL Route params */
    route: PropTypes.shape({
        /** Params from the URL path */
        params: PropTypes.shape({
            /** chatReportID passed via route: /iou/details/:chatReportID/:iouReportID */
            chatReportID: PropTypes.string,

            /** iouReportID passed via route: /iou/details/:chatReportID/:iouReportID */
            iouReportID: PropTypes.string,
        }),
    }).isRequired,

    /* Onyx Props */
    /** Holds data related to IOU view state, rather than the underlying IOU data. */
    iou: PropTypes.shape({
        /** Is the IOU Report currently being paid? */
        loading: PropTypes.bool,

        /** Error message, empty represents no error */
        error: PropTypes.bool,
    }),

    /** IOU Report data object */
    iouReport: PropTypes.shape({
        /** ID for the chatReport that this IOU is linked to */
        chatReportID: PropTypes.number,

        /** Manager is the person who currently owes money */
        managerEmail: PropTypes.string,

        /** Owner is the person who is owed money */
        ownerEmail: PropTypes.string,

        /** The IOU transactions */
        transactions: PropTypes.arrayOf(PropTypes.shape(iouTransactionPropTypes)),

        /** Does the report have an outstanding IOU that needs to be paid? */
        hasOutstandingIOU: PropTypes.bool,
    }).isRequired,

    /** Session info for the currently logged in user. */
    session: PropTypes.shape({
        /** Currently logged in user email */
        email: PropTypes.string,
    }).isRequired,

    ...withLocalizePropTypes,
};

const defaultProps = {
    iou: {},
};

class IOUDetailsModal extends Component {
    constructor(props) {
        super(props);

        // We always have the option to settle manually
        const paymentOptions = [CONST.IOU.PAYMENT_TYPE.ELSEWHERE];

        // Only allow settling via PayPal.me if the submitter has a name set
        if (props.iouReport.submitterPayPalMeAddress) {
            paymentOptions.push(CONST.IOU.PAYMENT_TYPE.PAYPAL_ME);
        }

        this.submitterPhoneNumber = undefined;
        this.isComponentMounted = false;

        this.state = {
            paymentType: CONST.IOU.PAYMENT_TYPE.ELSEWHERE,
            isSettlementMenuVisible: false,
            paymentOptions,
        };

        this.performIOUPayment = this.performIOUPayment.bind(this);
    }

    componentDidMount() {
        this.isComponentMounted = true;
        fetchIOUReportByID(this.props.route.params.iouReportID, this.props.route.params.chatReportID);
        this.addVenmoPaymentOptionIfAvailable();
    }

    componentWillUnmount() {
        this.isComponentMounted = false;
    }

    setMenuVisibility(isSettlementMenuVisible) {
        this.setState({isSettlementMenuVisible});
    }

    performIOUPayment() {
        payIOUReport({
            chatReportID: this.props.route.params.chatReportID,
            reportID: this.props.route.params.iouReportID,
            paymentMethodType: this.state.paymentType,
            amount: this.props.iouReport.total,
            currency: this.props.iouReport.currency,
            submitterPayPalMeAddress: this.props.iouReport.submitterPayPalMeAddress,
            submitterPhoneNumber: this.submitterPhoneNumber,
        });
    }

    /**
     * @param {String} phoneNumber
     * @returns {Boolean}
     */
    isValidUSPhone(phoneNumber) {
        // Remove alphanumeric characters and validate that this is in fact a phone number
        return CONST.REGEX.PHONE_E164_PLUS.test(phoneNumber.replace(CONST.REGEX.NON_ALPHA_NUMERIC, ''))

            // Next make sure it's a US phone number
            && CONST.REGEX.US_PHONE.test(phoneNumber);
    }

    /**
     * Checks to see if we can use Venmo. The following conditions must be met:
     *
     *   1. The IOU report currency is USD
     *   2. The submitter has as a valid US phone number
     *   3. Venmo app is installed
     *
     */
    addVenmoPaymentOptionIfAvailable() {
        if (this.props.iouReport.currency !== CONST.CURRENCY.USD) {
            return;
        }

        const submitterPhoneNumbers = lodashGet(this.props.iouReport, 'submitterPhoneNumbers', []);

        if (_.isEmpty(submitterPhoneNumbers)) {
            return;
        }

        this.submitterPhoneNumber = _.find(submitterPhoneNumbers, this.isValidUSPhone);

        if (!this.submitterPhoneNumber) {
            return;
        }

        isAppInstalled('venmo')
            .then((isVenmoInstalled) => {
                if (!isVenmoInstalled || !this.isComponentMounted) {
                    return;
                }

                this.setState(prevState => ({
                    paymentOptions: [...prevState.paymentOptions, CONST.IOU.PAYMENT_TYPE.VENMO],
                }));
            });
    }

    render() {
        const sessionEmail = lodashGet(this.props.session, 'email', null);
        const reportIsLoading = _.isUndefined(this.props.iouReport);
        const paymentTypeText = {
            [CONST.IOU.PAYMENT_TYPE.VENMO]: this.props.translate('iou.settleVenmo'),
            [CONST.IOU.PAYMENT_TYPE.PAYPAL_ME]: this.props.translate('iou.settlePaypalMe'),
            [CONST.IOU.PAYMENT_TYPE.ELSEWHERE]: this.props.translate('iou.settleElsewhere'),
        };
        return (
            <ScreenWrapper>
                <HeaderWithCloseButton
                    title={this.props.translate('common.details')}
                    onCloseButtonPress={Navigation.dismissModal}
                />
                {reportIsLoading ? <ActivityIndicator color={themeColors.text} /> : (
                    <View style={[styles.flex1, styles.justifyContentBetween]}>
                        <ScrollView contentContainerStyle={styles.iouDetailsContainer}>
                            <ReportActionItemIOUPreview
                                iou={this.props.iouReport}
                                shouldHidePayButton
                            />
                            <IOUTransactions
                                chatReportID={Number(this.props.route.params.chatReportID)}
                                iouReportID={Number(this.props.route.params.iouReportID)}
                                transactions={this.props.iouReport.transactions}
                                hasOutstandingIOU={this.props.iouReport.hasOutstandingIOU}
                            />
                        </ScrollView>
                        {(this.props.iouReport.hasOutstandingIOU
                            && this.props.iouReport.managerEmail === sessionEmail && (
                            <View style={styles.p5}>
                                <Button
                                    success
                                    shouldShowDropDownArrow={this.state.paymentOptions.length > 1}
                                    text={paymentTypeText[this.state.paymentType]}
                                    isLoading={this.props.iou.loading}
                                    onPress={this.performIOUPayment}
                                    onDropdownPress={() => {
                                        this.setMenuVisibility(true);
                                    }}
                                />
                                {this.state.paymentOptions.length > 1 && (
                                    <CreateMenu
                                        isVisible={this.state.isSettlementMenuVisible}
                                        onClose={() => this.setMenuVisibility(false)}
                                        onItemSelected={() => this.setMenuVisibility(false)}
                                        anchorPosition={styles.createMenuPositionRightSidepane}
                                        animationIn="fadeInUp"
                                        animationOut="fadeOutDown"
                                        headerText="Choose payment method:"
                                        menuItems={_.map(this.state.paymentOptions, paymentType => ({
                                            text: paymentTypeText[paymentType],
                                            onSelected: () => {
                                                this.setState({paymentType});
                                            },
                                        }))}
                                    />
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScreenWrapper>
        );
    }
}

IOUDetailsModal.propTypes = propTypes;
IOUDetailsModal.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        iou: {
            key: ONYXKEYS.IOU,
        },
        iouReport: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT_IOUS}${route.params.iouReportID}`,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
    }),
)(IOUDetailsModal);

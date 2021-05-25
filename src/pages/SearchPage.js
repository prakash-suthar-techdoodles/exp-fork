import React, {Component} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {withOnyx} from 'react-native-onyx';
import OptionsSelector from '../components/OptionsSelector';
import {getSearchOptions, getHeaderMessage} from '../libs/OptionsListUtils';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import KeyboardSpacer from '../components/KeyboardSpacer';
import Navigation from '../libs/Navigation/Navigation';
import ROUTES from '../ROUTES';
import withWindowDimensions, {
    windowDimensionsPropTypes,
} from '../components/withWindowDimensions';
import {fetchOrCreateChatReport} from '../libs/actions/Report';
import HeaderWithCloseButton from '../components/HeaderWithCloseButton';
import ScreenWrapper from '../components/ScreenWrapper';
import Timing from '../libs/actions/Timing';
import CONST from '../CONST';
import withLocalize, {withLocalizePropTypes} from '../components/withLocalize';
import compose from '../libs/compose';
import * as API from '../libs/API';

const personalDetailsPropTypes = PropTypes.shape({
    /** The login of the person (either email or phone number) */
    login: PropTypes.string.isRequired,

    /** The URL of the person's avatar (there should already be a default avatar if
    the person doesn't have their own avatar uploaded yet) */
    avatar: PropTypes.string.isRequired,

    /** This is either the user's full name, or their login if full name is an empty string */
    displayName: PropTypes.string.isRequired,
});

const propTypes = {
    /* Onyx Props */

    /** All of the personal details for everyone */
    personalDetails: PropTypes.objectOf(personalDetailsPropTypes).isRequired,

    /** All reports shared with the user */
    reports: PropTypes.shape({
        reportID: PropTypes.number,
        reportName: PropTypes.string,
    }).isRequired,

    /** Session of currently logged in user */
    session: PropTypes.shape({
        email: PropTypes.string.isRequired,
    }).isRequired,

    /** */
    countryCode: PropTypes.string.isRequired,

    /** Window Dimensions Props */
    ...windowDimensionsPropTypes,

    ...withLocalizePropTypes,
};

class SearchPage extends Component {
    constructor(props) {
        super(props);

        Timing.start(CONST.TIMING.SEARCH_RENDER);

        this.selectReport = this.selectReport.bind(this);
        this.validateInput = _.debounce(this.validateInput.bind(this), 300);
        const {recentReports, personalDetails, userToInvite} = getSearchOptions(
            props.reports,
            props.personalDetails,
            '',
        );

        this.preserveRecentReports = recentReports;

        this.state = {
            searchValue: '',
            headerMessage: '',
            recentReports,
            personalDetails,
            userToInvite,
        };
    }

    componentDidMount() {
        Timing.end(CONST.TIMING.SEARCH_RENDER);
    }

    /**
   * Returns the sections needed for the OptionsSelector
   *
   * @returns {Array}
   */
    getSections() {
        const sections = [{
            title: this.props.translate('common.recents'),
            data: this.state.recentReports.concat(this.state.personalDetails),
            shouldShow: true,
            indexOffset: 0,
        }];

        if (this.state.userToInvite) {
            sections.push({
                undefined,
                data: [this.state.userToInvite],
                shouldShow: true,
                indexOffset: 0,
            });
        }

        return sections;
    }

    /**
   * Reset the search value and redirect to the selected report
   *
   * @param {Object} option
   */
    selectReport(option) {
        if (!option) {
            return;
        }

        if (option.reportID) {
            this.setState(
                {
                    searchValue: '',
                },
                () => {
                    Navigation.navigate(ROUTES.getReportRoute(option.reportID));
                },
            );
        } else {
            fetchOrCreateChatReport([this.props.session.email, option.login]);
        }
    }

    validateInput(searchValue) {
    // Clears the header message on clearing the input
        if (!searchValue) {
            this.setState({
                headerMessage: '',
                userToInvite: null,
                recentReports: this.preserveRecentReports,
            });
            return;
        }
        let modifiedSearchValue = searchValue;
        const headerMessage = getHeaderMessage(
            this.state.personalDetails.length !== 0,
            false,
            searchValue,
        );

        // this.setState({headerMessage});

        if (/^\d+$/.test(searchValue)) {
            // Appends country code
            if (!searchValue.includes('+')) {
                modifiedSearchValue = `+${this.props.countryCode}${searchValue}`;
            }
        }

        API.IsValidPhoneNumber({phoneNumber: modifiedSearchValue}).then((resp) => {
            if (resp.isValid) {
                const {recentReports, personalDetails, userToInvite} = getSearchOptions(
                    this.props.reports,
                    this.props.personalDetails,
                    searchValue,
                );
                this.setState({
                    userToInvite,
                    recentReports,
                    personalDetails,
                    headerMessage: '',
                });
            } else {
                this.setState({
                    recentReports: this.preserveRecentReports,
                    userToInvite: null,
                    headerMessage,
                });
            }
        });
    }

    render() {
        const sections = this.getSections();

        return (
            <ScreenWrapper>
                <HeaderWithCloseButton
                    title={this.props.translate('common.search')}
                    onCloseButtonPress={() => Navigation.dismissModal(true)}
                />
                <View style={[styles.flex1, styles.w100]}>
                    <OptionsSelector
                        sections={sections}
                        value={this.state.searchValue}
                        onSelectRow={this.selectReport}
                        onChangeText={(searchValue = '') => {
                            this.setState({searchValue});
                            this.validateInput(searchValue);
                        }}
                        headerMessage={this.state.headerMessage}
                        hideSectionHeaders
                        hideAdditionalOptionStates
                        showTitleTooltip
                    />
                </View>
                <KeyboardSpacer />
            </ScreenWrapper>
        );
    }
}

SearchPage.propTypes = propTypes;
SearchPage.displayName = 'SearchPage';

export default compose(
    withLocalize,
    withWindowDimensions,
    withOnyx({
        reports: {
            key: ONYXKEYS.COLLECTION.REPORT,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
        countryCode: {
            key: ONYXKEYS.COUNTRY_CODE,
        },
    }),
)(SearchPage);

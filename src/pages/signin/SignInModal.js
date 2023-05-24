import React, {useEffect, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import SignInPage from './SignInPage';
import Modal from '../../components/Modal';
import CONST from '../../CONST';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import ONYXKEYS from '../../ONYXKEYS';
import * as SignInModalActions from '../../libs/actions/SignInModalActions';

const propTypes = {
    /** Modal visibility */
    isVisible: PropTypes.bool,
};

const defaultProps = {
    isVisible: false,
};

function SignInModal(props) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    return (
        <Modal
            isVisible={props.isVisible}
            onClose={SignInModalActions.hideSignInModal}
            type={CONST.MODAL.MODAL_TYPE.CENTERED_UNSWIPEABLE}
            shouldSetModalVisibility
        >
            <HeaderWithCloseButton onCloseButtonPress={SignInModalActions.hideSignInModal} />
            {isLoading ? <ActivityIndicator /> : <SignInPage />}
        </Modal>
    );
}

SignInModal.propTypes = propTypes;
SignInModal.defaultProps = defaultProps;
SignInModal.displayName = 'SignInModal';

export default withOnyx({
    isSignInModalOpen: {
        key: ONYXKEYS.IS_SIGN_IN_MODAL_OPEN,
        // initWithStoredValues: false,
    },
})(SignInModal);

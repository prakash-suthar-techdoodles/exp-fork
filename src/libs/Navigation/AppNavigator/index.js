import PropTypes from 'prop-types';
import React, {useContext, useEffect} from 'react';
import {InitialUrlContext} from '@src/InitialUrlContext';
import Navigation from '../Navigation';

const propTypes = {
    /** If we have an authToken this is true */
    authenticated: PropTypes.bool.isRequired,
};

function AppNavigator(props) {
    const initUrl = useContext(InitialUrlContext);

    useEffect(() => {
        Navigation.isNavigationReady().then(() => {
            Navigation.navigate(initUrl);
        });
    }, [initUrl]);

    if (props.authenticated) {
        const AuthScreens = require('./AuthScreens').default;

        // These are the protected screens and only accessible when an authToken is present
        return <AuthScreens />;
    }
    const PublicScreens = require('./PublicScreens').default;
    return <PublicScreens />;
}

AppNavigator.propTypes = propTypes;
AppNavigator.displayName = 'AppNavigator';
export default AppNavigator;

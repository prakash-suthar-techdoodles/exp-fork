import React from 'react';

class AppleSignInScript extends React.Component {
    componentDidMount() {
        const clientId = 'com.infinitered.expensify.test';
        const redirectURI = 'https://exptest.ngrok.io/appleauth';
        const scope = 'name email';
        const state = '';
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => {
            window.AppleID.auth.init({
                clientId,
                scope,
                redirectURI,
                state,
                usePopup: true,
            });
        };

        document.body.appendChild(script);
        document.addEventListener('AppleIDSignInOnSuccess', (event) => {
            // Handle successful response.
            console.log(event.detail.data);
        });

        // Listen for authorization failures.
        document.addEventListener('AppleIDSignInOnFailure', (event) => {
            // Handle error.
            console.log(event.detail.error);
        });

        this.cleanupScript = () => {
            // Remove the script from the DOM when the component unmounts
            document.body.removeChild(script);
        };
    }

    componentWillUnmount() {
        this.cleanupScript();
    }

    render() {
        return null;
    }
}

export default AppleSignInScript;

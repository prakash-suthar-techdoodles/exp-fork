import PropTypes from 'prop-types';
import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {withSafeAreaInsets} from 'react-native-safe-area-context';
import SignInGradient from '@assets/images/home-fade-gradient.svg';
import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import ImageSVG from '@components/ImageSVG';
import withLocalize, {withLocalizePropTypes} from '@components/withLocalize';
import usePrevious from '@hooks/usePrevious';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import compose from '@libs/compose';
import SignInPageHero from '@pages/signin/SignInPageHero';
import variables from '@styles/variables';
import * as App from '@userActions/App';
import BackgroundImage from './BackgroundImage';
import Footer from './Footer';
import SignInPageContent from './SignInPageContent';
import scrollViewContentContainerStyles from './signInPageStyles';

const propTypes = {
    /** The children to show inside the layout */
    children: PropTypes.node.isRequired,

    /** Welcome text to show in the header of the form, changes depending
     * on form type (for example, sign in) */
    welcomeText: PropTypes.string.isRequired,

    /** Welcome header to show in the header of the form, changes depending
     * on form type (for example, sign in) and small vs large screens */
    welcomeHeader: PropTypes.string.isRequired,

    /** Whether to show welcome text on a particular page */
    shouldShowWelcomeText: PropTypes.bool.isRequired,

    /** Whether to show welcome header on a particular page */
    shouldShowWelcomeHeader: PropTypes.bool.isRequired,

    /** A reference so we can expose scrollPageToTop */
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),

    /** Whether or not the sign in page is being rendered in the RHP modal */
    shouldShowSmallScreen: PropTypes.bool,

    /** Override the green headline copy */
    customHeadline: PropTypes.string,

    /** Override the smaller hero body copy below the headline */
    customHeroBody: PropTypes.string,

    ...withLocalizePropTypes,
};

const defaultProps = {
    innerRef: () => {},
    shouldShowSmallScreen: false,
    customHeadline: '',
    customHeroBody: '',
};

function SignInPageLayout(props) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const scrollViewRef = useRef();
    const prevPreferredLocale = usePrevious(props.preferredLocale);
    let containerStyles = [styles.flex1, styles.signInPageInner];
    let contentContainerStyles = [styles.flex1, styles.flexRow];
    const {windowHeight} = useWindowDimensions();
    const [isLoading, setIsLoading] = useState(true);

    // To scroll on both mobile and web, we need to set the container height manually
    const containerHeight = windowHeight - props.insets.top - props.insets.bottom;

    if (props.shouldShowSmallScreen) {
        containerStyles = [styles.flex1];
        contentContainerStyles = [styles.flex1, styles.flexColumn];
    }

    const scrollPageToTop = (animated = false) => {
        if (!scrollViewRef.current) {
            return;
        }
        scrollViewRef.current.scrollTo({y: 0, animated});
    };

    useImperativeHandle(props.innerRef, () => ({
        scrollPageToTop,
    }));

    useEffect(() => {
        App.preventBootSplashAutoHide();
    }, []);

    useEffect(() => {
        if (prevPreferredLocale !== props.preferredLocale) {
            return;
        }

        scrollPageToTop();
    }, [props.welcomeHeader, props.welcomeText, prevPreferredLocale, props.preferredLocale]);

    const scrollViewStyles = useMemo(() => scrollViewContentContainerStyles(styles), [styles]);

    return (
        <View style={containerStyles}>
            {isLoading && <FullScreenLoadingIndicator style={[styles.opacity1]} />}
            {!props.shouldShowSmallScreen ? (
                <View style={contentContainerStyles}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        style={[styles.signInPageLeftContainerWide, styles.flex1]}
                        contentContainerStyle={[styles.flex1]}
                    >
                        <SignInPageContent
                            welcomeHeader={props.welcomeHeader}
                            welcomeText={props.welcomeText}
                            shouldShowWelcomeText={props.shouldShowWelcomeText}
                            shouldShowWelcomeHeader={props.shouldShowWelcomeHeader}
                            shouldShowSmallScreen={props.shouldShowSmallScreen}
                        >
                            {props.children}
                        </SignInPageContent>
                    </ScrollView>
                    <ScrollView
                        style={[styles.flex1, StyleUtils.getBackgroundColorStyle(theme.signInPage)]}
                        contentContainerStyle={[styles.flex1]}
                        ref={scrollViewRef}
                    >
                        <View style={[styles.flex1]}>
                            <View style={styles.signInPageHeroCenter}>
                                <BackgroundImage
                                    isSmallScreen={false}
                                    pointerEvents="none"
                                    width={variables.signInHeroBackgroundWidth}
                                    onLoadEnd={() => {
                                        setIsLoading(false);
                                        App.resetBootSplashAutoHide();
                                    }}
                                />
                            </View>
                            <View>
                                <View style={[styles.t0, styles.l0, styles.h100, styles.pAbsolute, styles.signInPageGradient]}>
                                    <ImageSVG
                                        src={SignInGradient}
                                        height="100%"
                                        preserveAspectRatio="none"
                                    />
                                </View>
                                <View
                                    style={[
                                        styles.alignSelfCenter,
                                        StyleUtils.getMaximumWidth(variables.signInContentMaxWidth),
                                        props.isMediumScreenWidth ? styles.ph10 : {},
                                        props.isLargeScreenWidth ? styles.ph25 : {},
                                    ]}
                                >
                                    <SignInPageHero
                                        customHeadline={props.customHeadline}
                                        customHeroBody={props.customHeroBody}
                                    />
                                    <Footer navigateFocus={props.navigateFocus} />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={scrollViewStyles}
                    keyboardShouldPersistTaps="handled"
                    ref={scrollViewRef}
                >
                    <View style={[styles.flex1, styles.flexColumn, styles.overflowHidden, StyleUtils.getMinimumHeight(Math.max(variables.signInContentMinHeight, containerHeight))]}>
                        <BackgroundImage
                            isSmallScreen
                            pointerEvents="none"
                            width={variables.signInHeroBackgroundWidthMobile}
                            onLoadEnd={() => {
                                setIsLoading(false);
                                App.resetBootSplashAutoHide();
                            }}
                        />
                        <SignInPageContent
                            welcomeHeader={props.welcomeHeader}
                            welcomeText={props.welcomeText}
                            shouldShowWelcomeText={props.shouldShowWelcomeText}
                            shouldShowWelcomeHeader={props.shouldShowWelcomeHeader}
                            shouldShowSmallScreen={props.shouldShowSmallScreen}
                        >
                            {props.children}
                        </SignInPageContent>
                    </View>
                    <View style={[styles.flex0]}>
                        <Footer
                            navigateFocus={props.navigateFocus}
                            shouldShowSmallScreen
                        />
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

SignInPageLayout.propTypes = propTypes;
SignInPageLayout.displayName = 'SignInPageLayout';
SignInPageLayout.defaultProps = defaultProps;

const SignInPageLayoutWithRef = forwardRef((props, ref) => (
    <SignInPageLayout
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        innerRef={ref}
    />
));

SignInPageLayoutWithRef.displayName = 'SignInPageLayoutWithRef';

export default compose(withSafeAreaInsets, withLocalize)(SignInPageLayoutWithRef);

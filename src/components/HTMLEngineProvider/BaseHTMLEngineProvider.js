import _ from 'underscore';
import React, {useMemo} from 'react';
import {TRenderEngineProvider, RenderHTMLConfigProvider, defaultHTMLElementModels, HTMLContentModel} from 'react-native-render-html';
import PropTypes from 'prop-types';
import htmlRenderers from './HTMLRenderers';
import * as HTMLEngineUtils from './htmlEngineUtils';
import styles from '../../styles/styles';
import fontFamily from '../../styles/fontFamily';

const propTypes = {
    /** Whether text elements should be selectable */
    textSelectable: PropTypes.bool,

    /** Handle line breaks according to the HTML standard (default on web)  */
    enableExperimentalBRCollapsing: PropTypes.bool,

    children: PropTypes.node,
};

const defaultProps = {
    textSelectable: false,
    children: null,
    enableExperimentalBRCollapsing: false,
};

// Declare nonstandard tags and their content model here
const customHTMLElementModels = {
    edited: defaultHTMLElementModels.span.extend({
        tagName: 'edited',
    }),
    'muted-text': defaultHTMLElementModels.div.extend({
        tagName: 'muted-text',
        mixedUAStyles: {...styles.formError, ...styles.mb0},
    }),
    comment: defaultHTMLElementModels.div.extend({
        tagName: 'comment',
        mixedUAStyles: {whiteSpace: 'pre'},
    }),
    'email-comment': defaultHTMLElementModels.div.extend({
        tagName: 'email-comment',
        mixedUAStyles: {whiteSpace: 'normal'},
    }),
    'thread-title': defaultHTMLElementModels.span.extend({
        tagName: 'thread-title',
        contentModel: HTMLContentModel.textual,
        reactNativeProps: {
            text: {numberOfLines: 1},
        },
    }),
    strong: defaultHTMLElementModels.span.extend({
        tagName: 'strong',
        mixedUAStyles: {whiteSpace: 'pre'},
    }),
    'mention-user': defaultHTMLElementModels.span.extend({tagName: 'mention-user'}),
    'mention-here': defaultHTMLElementModels.span.extend({tagName: 'mention-here'}),
};

const defaultViewProps = {style: [styles.alignItemsStart, styles.userSelectText, styles.dFlex, styles.flexShrink1]};

// We are using the explicit composite architecture for performance gains.
// Configuration for RenderHTML is handled in a top-level component providing
// context to RenderHTMLSource components. See https://git.io/JRcZb
// Beware that each prop should be referentialy stable between renders to avoid
// costly invalidations and commits.
function BaseHTMLEngineProvider(props) {
    // We need to memoize this prop to make it referentially stable.
    const defaultTextProps = useMemo(() => ({selectable: props.textSelectable, allowFontScaling: false}), [props.textSelectable]);

    // We need to pass multiple system-specific fonts for emojis but
    // we can't apply multiple fonts at once so we need to pass fallback fonts.
    const fallbackFonts = {'ExpensifyNeue-Regular': fontFamily.EXP_NEUE};

    return (
        <TRenderEngineProvider
            customHTMLElementModels={customHTMLElementModels}
            baseStyle={styles.webViewStyles.baseFontStyle}
            tagsStyles={styles.webViewStyles.tagStyles}
            enableCSSInlineProcessing={false}
            systemFonts={_.values(fontFamily)}
            fallbackFonts={fallbackFonts}
        >
            <RenderHTMLConfigProvider
                defaultTextProps={defaultTextProps}
                defaultViewProps={defaultViewProps}
                renderers={htmlRenderers}
                computeEmbeddedMaxWidth={HTMLEngineUtils.computeEmbeddedMaxWidth}
                enableExperimentalBRCollapsing={props.enableExperimentalBRCollapsing}
            >
                {props.children}
            </RenderHTMLConfigProvider>
        </TRenderEngineProvider>
    );
}

BaseHTMLEngineProvider.displayName = 'BaseHTMLEngineProvider';
BaseHTMLEngineProvider.propTypes = propTypes;
BaseHTMLEngineProvider.defaultProps = defaultProps;

export default BaseHTMLEngineProvider;

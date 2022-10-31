import React from 'react';
import {Linking} from 'react-native';
import {
    TNodeChildrenRenderer,
} from 'react-native-render-html';
import lodashGet from 'lodash/get';
import htmlRendererPropTypes from './htmlRendererPropTypes';
import * as HTMLEngineUtils from '../htmlEngineUtils';
import * as Link from '../../../libs/actions/Link';
import CONFIG from '../../../CONFIG';
import Text from '../../Text';
import CONST from '../../../CONST';
import styles from '../../../styles/styles';
import Navigation from '../../../libs/Navigation/Navigation';
import AnchorForCommentsOnly from '../../AnchorForCommentsOnly';
import AnchorForAttachmentsOnly from '../../AnchorForAttachmentsOnly';
import * as Url from '../../../libs/Url';

const AnchorRenderer = (props) => {
    const htmlAttribs = props.tnode.attributes;

    // An auth token is needed to download Expensify chat attachments
    const isAttachment = Boolean(htmlAttribs[CONST.ATTACHMENT_SOURCE_ATTRIBUTE]);
    const displayName = lodashGet(props.tnode, 'domNode.children[0].data', '');
    const parentStyle = lodashGet(props.tnode, 'parent.styles.nativeTextRet', {});
    const attrHref = htmlAttribs.href || '';
    const attrPathname = new URL(attrHref).pathname.replace('/', '');
    const internalNewExpensifyPath = (attrHref.startsWith(CONST.NEW_EXPENSIFY_URL) && attrHref.replace(CONST.NEW_EXPENSIFY_URL, ''))
        || (attrHref.startsWith(CONST.STAGING_NEW_EXPENSIFY_URL) && attrHref.replace(CONST.STAGING_NEW_EXPENSIFY_URL, ''));
    const internalExpensifyPath = Url.hasSameOrigin(attrHref, CONFIG.EXPENSIFY.EXPENSIFY_URL)
                                    && attrPathname !== CONFIG.EXPENSIFY.CONCIERGE_PATHNAME
                                    && attrPathname;

    const navigateToLink = () => {
        // If we are handling a New Expensify link then we will assume this should be opened by the app internally. This ensures that the links are opened internally via react-navigation
        // instead of in a new tab or with a page refresh (which is the default behavior of an anchor tag)
        if (internalNewExpensifyPath) {
            Navigation.navigate(internalNewExpensifyPath);
            return;
        }

        // If we are handling an old dot Expensify link we need to open it with openOldDotLink() so we can navigate to it with the user already logged in.
        // As attachments also use expensify.com we don't want it working the same as links.
        if (internalExpensifyPath && !isAttachment) {
            Link.openOldDotLink(internalExpensifyPath);
            return;
        }
        Linking.openURL(attrHref);
    };

    if (!HTMLEngineUtils.isInsideComment(props.tnode)) {
        // This is not a comment from a chat, the AnchorForCommentsOnly uses a Pressable to create a context menu on right click.
        // We don't have this behaviour in other links in NewDot
        // TODO: We should use TextLink, but I'm leaving it as Text for now because TextLink breaks the alignment in Android.
        return (
            <Text
                style={styles.link}
                onPress={navigateToLink}
            >
                <TNodeChildrenRenderer tnode={props.tnode} />
            </Text>
        );
    }

    if (isAttachment) {
        return (
            <AnchorForAttachmentsOnly
                source={attrHref}
                displayName={displayName}
            />
        );
    }

    return (
        <AnchorForCommentsOnly
            href={attrHref}

            // Unless otherwise specified open all links in
            // a new window. On Desktop this means that we will
            // skip the default Save As... download prompt
            // and defer to whatever browser the user has.
            // eslint-disable-next-line react/jsx-props-no-multi-spaces
            target={htmlAttribs.target || '_blank'}
            rel={htmlAttribs.rel || 'noopener noreferrer'}
            style={{...props.style, ...parentStyle}}
            key={props.key}
            displayName={displayName}

            // Only pass the press handler for internal links, for public links fallback to default link handling
            onPress={(internalNewExpensifyPath || internalExpensifyPath) ? navigateToLink : undefined}
        >
            <TNodeChildrenRenderer tnode={props.tnode} />
        </AnchorForCommentsOnly>
    );
};

AnchorRenderer.propTypes = htmlRendererPropTypes;
AnchorRenderer.displayName = 'AnchorRenderer';

export default AnchorRenderer;

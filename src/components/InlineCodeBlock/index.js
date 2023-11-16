import _ from 'lodash';
import React from 'react';
import Text from '@components/Text';
import inlineCodeBlockPropTypes from './inlineCodeBlockPropTypes';
import styles from '@styles/styles';

function InlineCodeBlock(props) {
    const TDefaultRenderer = props.TDefaultRenderer;
    const textStyles = _.omit(props.textStyle, 'textDecorationLine');

    return (
        <TDefaultRenderer
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props.defaultRendererProps}
        >
            <Text style={{...props.boxModelStyle, ...textStyles, ...styles.codeWordWrapper}}>{props.defaultRendererProps.tnode.data}</Text>
        </TDefaultRenderer>
    );
}

InlineCodeBlock.propTypes = inlineCodeBlockPropTypes;
InlineCodeBlock.displayName = 'InlineCodeBlock';
export default InlineCodeBlock;

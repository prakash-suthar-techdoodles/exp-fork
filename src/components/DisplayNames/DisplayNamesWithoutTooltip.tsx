import React from 'react';
import {StyleProp, TextStyle} from 'react-native';
import RenderHTML from '@components/RenderHTML';
import Text from '@components/Text';
import StringUtils from '@libs/StringUtils';
import useThemeStyles from '@styles/useThemeStyles';

type DisplayNamesWithoutTooltipProps = {
    /** The full title of the DisplayNames component (not split up) */
    fullTitle?: string;

    /** Arbitrary styles of the displayName text */
    textStyles?: StyleProp<TextStyle>;

    /** Number of lines before wrapping */
    numberOfLines?: number;
};

function DisplayNamesWithoutTooltip({textStyles = [], numberOfLines = 1, fullTitle = ''}: DisplayNamesWithoutTooltipProps) {
    const styles = useThemeStyles();
    const title = StringUtils.containsHtml(fullTitle) ? <RenderHTML html={fullTitle} /> : fullTitle;

    return (
        <Text
            style={[textStyles, numberOfLines === 1 ? styles.pre : styles.preWrap]}
            numberOfLines={numberOfLines}
        >
            {title}
        </Text>
    );
}

DisplayNamesWithoutTooltip.displayName = 'DisplayNamesWithoutTooltip';

export default DisplayNamesWithoutTooltip;

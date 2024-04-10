import React from 'react';
import {View} from 'react-native';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import {PressableWithoutFeedback} from '@components/Pressable';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import type {Ancestor} from '@libs/ReportUtils';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

type ThreadDividerProps = {
    /** Thread ancestor */
    ancestor: Ancestor;

    /** Whether the link is disabled */
    isLinkDisabled?: boolean;
};

function ThreadDivider({ancestor, isLinkDisabled = false}: ThreadDividerProps) {
    const styles = useThemeStyles();
    const theme = useTheme();
    const {translate} = useLocalize();

    return (
        <View
            style={[styles.flexRow, styles.alignItemsCenter, styles.ml5, styles.mt3, styles.mb1, styles.userSelectNone]}
            dataSet={{[CONST.SELECTION_SCRAPER_HIDDEN_ELEMENT]: true}}
        >
            {isLinkDisabled ? (
                <>
                    <Icon
                        src={Expensicons.Thread}
                        fill={theme.icon}
                        width={variables.iconSizeExtraSmall}
                        height={variables.iconSizeExtraSmall}
                    />
                    <Text style={[styles.threadDividerText, styles.textSupporting, styles.ml1, styles.userSelectNone]}>{translate('threads.thread')}</Text>
                </>
            ) : (
                <PressableWithoutFeedback
                    onPress={() => Navigation.navigate(ROUTES.REPORT_WITH_ID.getRoute(ancestor?.report?.parentReportID ?? ''))}
                    accessibilityLabel={translate('threads.thread')}
                    role={CONST.ROLE.BUTTON}
                    style={[styles.flexRow, styles.alignItemsCenter, styles.gap1]}
                >
                    <Icon
                        src={Expensicons.Thread}
                        fill={theme.link}
                        width={variables.iconSizeExtraSmall}
                        height={variables.iconSizeExtraSmall}
                    />
                    <Text style={[styles.threadDividerText, styles.link]}>{translate('threads.thread')}</Text>
                </PressableWithoutFeedback>
            )}
            {!ancestor.shouldDisplayNewMarker && <View style={[styles.threadDividerLine]} />}
        </View>
    );
}

ThreadDivider.displayName = 'ThreadDivider';
export default ThreadDivider;

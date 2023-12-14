import React from 'react';
import {View} from 'react-native';
import {Circle, Rect} from 'react-native-svg';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import Icon from './Icon';
import * as Expensicons from './Icon/Expensicons';
import PressableWithFeedback from './Pressable/PressableWithFeedback';
import SkeletonViewContentLoader from './SkeletonViewContentLoader';

type ReportHeaderSkeletonViewProps = {
    shouldAnimate?: boolean;
    onBackButtonPress?: () => void;
};

function ReportHeaderSkeletonView({shouldAnimate = true, onBackButtonPress = () => {}}: ReportHeaderSkeletonViewProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {shouldUseNarrowLayout} = useResponsiveLayout();

    return (
        <View style={[styles.appContentHeader]}>
            <View style={[styles.appContentHeaderTitle, !shouldUseNarrowLayout && styles.pl5]}>
                {shouldUseNarrowLayout && (
                    <PressableWithFeedback
                        onPress={onBackButtonPress}
                        style={[styles.LHNToggle]}
                        role={CONST.ROLE.BUTTON}
                        accessibilityLabel={translate('common.back')}
                    >
                        <Icon src={Expensicons.BackArrow} />
                    </PressableWithFeedback>
                )}
                <SkeletonViewContentLoader
                    animate={shouldAnimate}
                    width={styles.w100.width}
                    height={variables.contentHeaderHeight}
                    backgroundColor={theme.highlightBG}
                    foregroundColor={theme.border}
                >
                    <Circle
                        cx="20"
                        cy="33"
                        r="20"
                    />
                    <Rect
                        x="55"
                        y="20"
                        width="30%"
                        height="8"
                    />
                    <Rect
                        x="55"
                        y="40"
                        width="40%"
                        height="8"
                    />
                </SkeletonViewContentLoader>
            </View>
        </View>
    );
}

ReportHeaderSkeletonView.displayName = 'ReportHeaderSkeletonView';

export default ReportHeaderSkeletonView;

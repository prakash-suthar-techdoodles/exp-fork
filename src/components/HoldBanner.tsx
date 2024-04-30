import React from 'react';
import {View} from 'react-native';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Text from './Text';
import TextPill from './TextPill';

type HoldBannerProps = {
    isRequestDuplicate?: boolean;
    shouldShowBorderBottom?: boolean;
};

function HoldBanner({isRequestDuplicate = false, shouldShowBorderBottom = false}: HoldBannerProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    return (
        <View style={[styles.dFlex, styles.flexRow, styles.alignItemsCenter, styles.pb3, styles.ph5, shouldShowBorderBottom ? styles.borderBottom : {}]}>
            <TextPill>{translate('iou.hold')}</TextPill>
            <Text style={[styles.textLabel, styles.pl3, styles.mw100, styles.flexShrink1]}>{isRequestDuplicate ? translate('iou.expenseDuplicate') : translate('iou.expenseOnHold')}</Text>
        </View>
    );
}

HoldBanner.displayName = 'HoldBanner';

export default HoldBanner;

import {format} from 'date-fns';
import React, {useCallback} from 'react';
import {View} from 'react-native';
import Avatar from '@components/Avatar';
import Button from '@components/Button';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import {usePersonalDetails} from '@components/OnyxProvider';
import PressableWithFeedback from '@components/Pressable/PressableWithFeedback';
import Text from '@components/Text';
import TextWithTooltip from '@components/TextWithTooltip';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import * as CurrencyUtils from '@libs/CurrencyUtils';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import type {SearchTransactionType} from '@src/types/onyx/SearchResults';
import BaseListItem from './BaseListItem';
import type {ListItem, TransactionListItemProps} from './types';

const getTypeIcon = (type: SearchTransactionType) => {
    switch (type) {
        case CONST.SEARCH_TRANSACTION_TYPE.CASH:
            return Expensicons.Cash;
        case CONST.SEARCH_TRANSACTION_TYPE.CARD:
            return Expensicons.CreditCard;
        case CONST.SEARCH_TRANSACTION_TYPE.DISTANCE:
            return Expensicons.Car;
        default:
            return Expensicons.Cash;
    }
};

function TransactionListItem<TItem extends ListItem>({
    item,
    isFocused,
    showTooltip,
    isDisabled,
    canSelectMultiple,
    onSelectRow,
    onCheckboxPress,
    onDismissError,
    shouldPreventDefaultFocusOnSelectRow,
    rightHandSideComponent,
    onFocus,
    shouldSyncFocus,
}: TransactionListItemProps<TItem>) {
    const styles = useThemeStyles();
    const theme = useTheme();
    const StyleUtils = useStyleUtils();
    const {isSmallScreenWidth} = useWindowDimensions();

    const personalDetails = usePersonalDetails() ?? CONST.EMPTY_OBJECT;
    const focusedBackgroundColor = styles.sidebarLinkActive.backgroundColor;
    const hoveredBackgroundColor = styles.sidebarLinkHover?.backgroundColor ? styles.sidebarLinkHover.backgroundColor : theme.sidebar;

    const typeIcon = getTypeIcon(item.type);

    const handleCheckboxPress = useCallback(() => {
        if (onCheckboxPress) {
            onCheckboxPress(item);
        } else {
            onSelectRow(item);
        }
    }, [item, onCheckboxPress, onSelectRow]);

    if (isSmallScreenWidth) {
        return (
            <BaseListItem
                item={item}
                pressableStyle={[[styles.selectionListPressableItemWrapper, item.isSelected && styles.activeComponentBG, isFocused && styles.sidebarLinkActive]]}
                wrapperStyle={[styles.flexColumn, styles.flex1, styles.userSelectNone, styles.alignItemsStretch]}
                containerStyle={[styles.mb3]}
                isFocused={isFocused}
                isDisabled={isDisabled}
                showTooltip={showTooltip}
                canSelectMultiple={canSelectMultiple}
                onSelectRow={() => {}}
                onDismissError={onDismissError}
                shouldPreventDefaultFocusOnSelectRow={shouldPreventDefaultFocusOnSelectRow}
                rightHandSideComponent={rightHandSideComponent}
                errors={item.errors}
                pendingAction={item.pendingAction}
                keyForList={item.keyForList}
                onFocus={onFocus}
                shouldSyncFocus={shouldSyncFocus}
                hoverStyle={item.isSelected && styles.activeComponentBG}
            >
                {(hovered) => (
                    <>
                        <View style={[styles.flex1, styles.flexRow, styles.alignItemsCenter, styles.justifyContentBetween]}>
                            <View style={[styles.flexRow, styles.flex1, styles.alignItemsCenter, styles.gap3]}>
                                <View style={[styles.flexRow, styles.gap3, styles.alignItemsCenter]}>
                                    <Avatar
                                        imageStyles={[styles.alignSelfCenter]}
                                        size={CONST.AVATAR_SIZE.SMALL}
                                        source={personalDetails[item.managerID]?.avatar}
                                        name={personalDetails[item.managerID]?.displayName}
                                        type={CONST.ICON_TYPE_WORKSPACE}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        style={[styles.flex1, styles.flexGrow1, styles.textStrong, styles.textMicro]}
                                    >
                                        {personalDetails[item.managerID]?.displayName}
                                    </Text>
                                </View>
                                <Icon
                                    src={Expensicons.ArrowRightLong}
                                    width={variables.iconSizeXXSmall}
                                    height={variables.iconSizeXXSmall}
                                    fill={theme.icon}
                                />
                                <View style={[styles.flexRow, styles.gap3, styles.alignItemsCenter]}>
                                    <Avatar
                                        imageStyles={[styles.alignSelfCenter]}
                                        size={CONST.AVATAR_SIZE.SMALL}
                                        source={personalDetails[item.accountID]?.avatar}
                                        name={personalDetails[item.accountID]?.displayName}
                                        type={CONST.ICON_TYPE_WORKSPACE}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        style={[styles.flex1, styles.flexGrow1, styles.textStrong, styles.textMicro]}
                                    >
                                        {personalDetails[item.accountID]?.displayName}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.flexShrink0}>
                                <Button
                                    success
                                    onPress={() => {}}
                                    small
                                    pressOnEnter
                                    text="View"
                                />
                            </View>
                        </View>
                        <View></View>
                    </>
                )}
            </BaseListItem>
        );
    }

    return (
        <BaseListItem
            item={item}
            pressableStyle={[[styles.selectionListPressableItemWrapper, item.isSelected && styles.activeComponentBG, isFocused && styles.sidebarLinkActive]]}
            wrapperStyle={[styles.flexRow, styles.flex1, styles.justifyContentBetween, styles.userSelectNone, styles.alignItemsCenter]}
            containerStyle={[styles.mb3]}
            isFocused={isFocused}
            isDisabled={isDisabled}
            showTooltip={showTooltip}
            canSelectMultiple={canSelectMultiple}
            onSelectRow={() => {}}
            onDismissError={onDismissError}
            shouldPreventDefaultFocusOnSelectRow={shouldPreventDefaultFocusOnSelectRow}
            rightHandSideComponent={rightHandSideComponent}
            errors={item.errors}
            pendingAction={item.pendingAction}
            keyForList={item.keyForList}
            onFocus={onFocus}
            shouldSyncFocus={shouldSyncFocus}
            hoverStyle={item.isSelected && styles.activeComponentBG}
        >
            {(hovered) => (
                <>
                    {canSelectMultiple && (
                        <PressableWithFeedback
                            accessibilityLabel={item.text ?? ''}
                            role={CONST.ROLE.BUTTON}
                            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                            disabled={isDisabled || item.isDisabledCheckbox}
                            onPress={handleCheckboxPress}
                            style={[styles.cursorUnset, StyleUtils.getCheckboxPressableStyle(), item.isDisabledCheckbox && styles.cursorDisabled, styles.mr3]}
                        >
                            <View style={[StyleUtils.getCheckboxContainerStyle(20), StyleUtils.getMultiselectListStyles(!!item.isSelected, !!item.isDisabled)]}>
                                {item.isSelected && (
                                    <Icon
                                        src={Expensicons.Checkmark}
                                        fill={theme.textLight}
                                        height={14}
                                        width={14}
                                    />
                                )}
                            </View>
                        </PressableWithFeedback>
                    )}
                    <View style={[styles.flexRow, styles.flex1, styles.gap3]}>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <TextWithTooltip
                                shouldShowTooltip={showTooltip}
                                text={format(new Date(item.created), 'MMM dd')}
                                style={[styles.optionDisplayName, styles.textNormalThemeText, styles.pre, styles.justifyContentCenter]}
                            />
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <TextWithTooltip
                                shouldShowTooltip={showTooltip}
                                text={item.description}
                                style={[styles.optionDisplayName, styles.textNormalThemeText, styles.pre, styles.justifyContentCenter]}
                            />
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <View style={[styles.flexRow, styles.gap3, styles.flex1, styles.alignItemsCenter]}>
                                <Avatar
                                    imageStyles={[styles.alignSelfCenter]}
                                    size={CONST.AVATAR_SIZE.SMALL}
                                    source={personalDetails[item.managerID]?.avatar}
                                    name={personalDetails[item.managerID]?.displayName}
                                    type={CONST.ICON_TYPE_WORKSPACE}
                                />
                                <Text
                                    numberOfLines={1}
                                    style={[styles.flex1, styles.flexGrow1, styles.textStrong]}
                                >
                                    {personalDetails[item.managerID]?.displayName}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <View style={[styles.flexRow, styles.gap3, styles.flex1, styles.alignItemsCenter]}>
                                <Avatar
                                    imageStyles={[styles.alignSelfCenter]}
                                    size={CONST.AVATAR_SIZE.SMALL}
                                    source={personalDetails[item.accountID]?.avatar}
                                    name={personalDetails[item.accountID]?.displayName}
                                    type={CONST.ICON_TYPE_WORKSPACE}
                                />
                                <Text
                                    numberOfLines={1}
                                    style={[styles.flex1, styles.flexGrow1, styles.textStrong]}
                                >
                                    {personalDetails[item.accountID]?.displayName}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <TextWithTooltip
                                shouldShowTooltip={showTooltip}
                                text={item.category}
                                style={[styles.optionDisplayName, styles.textNormalThemeText, styles.pre, styles.justifyContentCenter]}
                            />
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <TextWithTooltip
                                shouldShowTooltip={showTooltip}
                                text={item.tag}
                                style={[styles.optionDisplayName, styles.textNormalThemeText, styles.pre, styles.justifyContentCenter]}
                            />
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsEnd]}>
                            <TextWithTooltip
                                shouldShowTooltip={showTooltip}
                                text={`${CurrencyUtils.getLocalizedCurrencySymbol(item.currency)}${item.amount}`}
                                style={[styles.optionDisplayName, styles.textNewKansasNormal, styles.pre, styles.justifyContentCenter]}
                            />
                        </View>
                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <Icon
                                src={typeIcon}
                                fill={theme.icon}
                            />
                        </View>

                        <View style={[styles.flex1, styles.flexColumn, styles.justifyContentCenter, styles.alignItemsStretch]}>
                            <Button
                                success
                                onPress={() => {
                                    onSelectRow(item);
                                }}
                                small
                                pressOnEnter
                                text="View"
                            />
                        </View>
                    </View>
                    {!!item.rightElement && item.rightElement}
                </>
            )}
        </BaseListItem>
    );
}

TransactionListItem.displayName = 'TransactionListItem';

export default TransactionListItem;

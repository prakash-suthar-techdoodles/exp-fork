import React, {useMemo} from 'react';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import AdminPolicyAccessOrNotFoundWrapper from '@pages/workspace/AdminPolicyAccessOrNotFoundWrapper';
import FeatureEnabledAccessOrNotFoundWrapper from '@pages/workspace/FeatureEnabledAccessOrNotFoundWrapper';
import withPolicy from '@pages/workspace/withPolicy';
import type {WithPolicyProps} from '@pages/workspace/withPolicy';
import CONST from '@src/CONST';
import type {Tenant} from '@src/types/onyx/Policy';

function XeroImportPage({policy}: WithPolicyProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const policyID = policy?.id ?? '';
    const {importCustomers, importTaxRates, importTrackingCategories, pendingFields} = policy?.connections?.xero?.config ?? {};

    const tenants = useMemo<Tenant[]>(() => policy?.connections?.xero?.data?.tenants ?? [], [policy?.connections?.xero.data.tenants]);
    const currentXeroOrganization = tenants.find((tenant) => tenant.id === policy?.connections?.xero.config.tenantID);

    const sections = useMemo(
        () => [
            {
                description: translate('workspace.accounting.accounts'),
                action: () => {},
                hasError: !!policy?.errors?.enableNewCategories,
                title: translate('workspace.accounting.imported'),
                pendingAction: pendingFields?.enableNewCategories,
            },
            {
                description: translate('workspace.xero.trackingCategories'),
                action: () => {},
                hasError: !!policy?.errors?.importTrackingCategories,
                title: importTrackingCategories ? translate('workspace.accounting.importedAsTags') : '',
                pendingAction: pendingFields?.importTrackingCategories,
            },
            {
                description: translate('workspace.xero.customers'),
                action: () => {},
                hasError: !!policy?.errors?.importCustomers,
                title: importCustomers ? translate('workspace.accounting.importedAsTags') : '',
                pendingAction: pendingFields?.importCustomers,
            },
            {
                description: translate('workspace.accounting.taxes'),
                action: () => {},
                hasError: !!policy?.errors?.importTaxes,
                title: importTaxRates ? translate('workspace.accounting.imported') : '',
                pendingAction: pendingFields?.importTaxRates,
            },
        ],
        [
            importCustomers,
            importTaxRates,
            importTrackingCategories,
            pendingFields?.enableNewCategories,
            pendingFields?.importTaxRates,
            pendingFields?.importCustomers,
            pendingFields?.importTrackingCategories,
            policy?.errors?.importTrackingCategories,
            policy?.errors?.enableNewCategories,
            policy?.errors?.importCustomers,
            policy?.errors?.importTaxes,
            translate,
        ],
    );

    return (
        <AdminPolicyAccessOrNotFoundWrapper policyID={policyID}>
            <FeatureEnabledAccessOrNotFoundWrapper
                policyID={policyID}
                featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            >
                <ScreenWrapper
                    includeSafeAreaPaddingBottom={false}
                    shouldEnableMaxHeight
                    testID={XeroImportPage.displayName}
                >
                    <HeaderWithBackButton
                        title={translate('workspace.accounting.import')}
                        subtitle={currentXeroOrganization?.name}
                    />
                    <ScrollView contentContainerStyle={styles.pb2}>
                        <Text style={[styles.ph5, styles.pb5]}>{translate('workspace.xero.importDescription')}</Text>
                        {sections.map((section) => (
                            <OfflineWithFeedback
                                key={section.description}
                                pendingAction={section.pendingAction}
                            >
                                <MenuItemWithTopDescription
                                    title={section.title}
                                    description={section.description}
                                    shouldShowRightIcon
                                    onPress={section.action}
                                    brickRoadIndicator={section.hasError ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined}
                                />
                            </OfflineWithFeedback>
                        ))}
                    </ScrollView>
                </ScreenWrapper>
            </FeatureEnabledAccessOrNotFoundWrapper>
        </AdminPolicyAccessOrNotFoundWrapper>
    );
}

XeroImportPage.displayName = 'PolicyXeroImportPage';

export default withPolicy(XeroImportPage);

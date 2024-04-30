import Onyx from 'react-native-onyx';
import CONST from '@src/CONST';
import OnyxUpdateManager from '@src/libs/actions/OnyxUpdateManager';
import * as Policy from '@src/libs/actions/Policy';
import ONYXKEYS from '@src/ONYXKEYS';
import createRandomPolicy from '../utils/collections/policies';
import createRandomPolicyCategories from '../utils/collections/policyCategory';
import * as TestHelper from '../utils/TestHelper';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';

OnyxUpdateManager();
describe('actions/PolicyCategory', () => {
    beforeAll(() => {
        Onyx.init({
            keys: ONYXKEYS,
        });
    });

    beforeEach(() => {
        // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
        global.fetch = TestHelper.getGlobalFetchMock();
        return Onyx.clear().then(waitForBatchedUpdates);
    });

    describe('SetWorkspaceRequiresCategory', () => {
        it('Enable require category', () => {
            const fakePolicy = createRandomPolicy(0);
            fakePolicy.requiresCategory = false;

            // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
            fetch.pause();
            return (
                Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`, fakePolicy)
                    .then(() => {
                        Policy.setWorkspaceRequiresCategory(fakePolicy.id, true);
                        return waitForBatchedUpdates();
                    })
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policy) => {
                                        Onyx.disconnect(connectionID);
                                        // Check if policy requiresCategory was updated with correct values
                                        expect(policy?.requiresCategory).toBeTruthy();
                                        expect(policy?.pendingFields?.requiresCategory).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE);
                                        expect(policy?.errors?.requiresCategory).toBeFalsy();
                                        resolve();
                                    },
                                });
                            }),
                    )
                    // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
                    .then(fetch.resume)
                    .then(waitForBatchedUpdates)
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policy) => {
                                        Onyx.disconnect(connectionID);
                                        // Check if the policy pendingFields was cleared
                                        expect(policy?.pendingFields?.requiresCategory).toBeFalsy();
                                        resolve();
                                    },
                                });
                            }),
                    )
            );
        });
    });
    describe('CreateWorkspaceCategories', () => {
        it('Create a new policy category', () => {
            const fakePolicy = createRandomPolicy(0);
            const fakeCategories = createRandomPolicyCategories(3);
            const newCategoryName = 'New category';
            // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
            fetch.pause();
            Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`, fakePolicy)
                .then(() => {
                    Onyx.set(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`, fakeCategories);
                })
                .then(() => {
                    Policy.createPolicyCategory(fakePolicy.id, newCategoryName);
                    return waitForBatchedUpdates();
                })
                .then(
                    () =>
                        new Promise<void>((resolve) => {
                            const connectionID = Onyx.connect({
                                key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                waitForCollectionCallback: false,
                                callback: (policyCategories) => {
                                    Onyx.disconnect(connectionID);
                                    const newCategory = policyCategories?.[newCategoryName];

                                    expect(newCategory?.name).toBe(newCategoryName);
                                    expect(newCategory?.errors).toBeFalsy();

                                    resolve();
                                },
                            });
                        }),
                ) // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
                .then(fetch.resume)
                .then(waitForBatchedUpdates)
                .then(
                    () =>
                        new Promise<void>((resolve) => {
                            const connectionID = Onyx.connect({
                                key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                waitForCollectionCallback: false,
                                callback: (policyCategories) => {
                                    Onyx.disconnect(connectionID);

                                    const newCategory = policyCategories?.[newCategoryName];
                                    expect(newCategory?.errors).toBeFalsy();
                                    expect(newCategory?.pendingAction).toBeFalsy();

                                    resolve();
                                },
                            });
                        }),
                );
        });
    });
    describe('RenameWorkspaceCategory', () => {
        it('Rename category', () => {
            const fakePolicy = createRandomPolicy(0);
            const fakeCategories = createRandomPolicyCategories(3);
            const oldCategoryName = Object.keys(fakeCategories)[0];
            const newCategoryName = 'Updated category';
            // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
            fetch.pause();
            return (
                Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`, fakePolicy)
                    .then(() => {
                        Onyx.set(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`, fakeCategories);
                    })
                    .then(() => {
                        Policy.renamePolicyCategory(fakePolicy.id, {
                            oldName: oldCategoryName,
                            newName: newCategoryName,
                        });
                        return waitForBatchedUpdates();
                    })
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);

                                        expect(policyCategories?.[oldCategoryName]).toBeFalsy();
                                        expect(policyCategories?.[newCategoryName]?.name).toBe(newCategoryName);
                                        expect(policyCategories?.[newCategoryName]?.pendingAction).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE);
                                        expect(policyCategories?.[newCategoryName]?.pendingFields?.name).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE);

                                        resolve();
                                    },
                                });
                            }),
                    )
                    // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
                    .then(fetch.resume)
                    .then(waitForBatchedUpdates)
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);

                                        expect(policyCategories?.[newCategoryName]?.pendingAction).toBeFalsy();
                                        expect(policyCategories?.[newCategoryName]?.pendingFields?.name).toBeFalsy();

                                        resolve();
                                    },
                                });
                            }),
                    )
            );
        });
    });
    describe('SetWorkspaceCategoriesEnabled', () => {
        it('Enable category', () => {
            const fakePolicy = createRandomPolicy(0);
            const fakeCategories = createRandomPolicyCategories(3);
            const categoryNameToUpdate = Object.keys(fakeCategories)[0];
            const categoriesToUpdate = {
                [categoryNameToUpdate]: {
                    name: categoryNameToUpdate,
                    enabled: true,
                },
            };
            // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
            fetch.pause();
            return (
                Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`, fakePolicy)
                    .then(() => {
                        Onyx.set(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`, fakeCategories);
                    })
                    .then(() => {
                        Policy.setWorkspaceCategoryEnabled(fakePolicy.id, categoriesToUpdate);
                        return waitForBatchedUpdates();
                    })
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);

                                        expect(policyCategories?.[categoryNameToUpdate]?.enabled).toBeTruthy();
                                        expect(policyCategories?.[categoryNameToUpdate]?.pendingAction).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE);
                                        expect(policyCategories?.[categoryNameToUpdate]?.pendingFields?.enabled).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE);
                                        expect(policyCategories?.[categoryNameToUpdate]?.errors).toBeFalsy();
                                        resolve();
                                    },
                                });
                            }),
                    )
                    // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
                    .then(fetch.resume)
                    .then(waitForBatchedUpdates)
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);

                                        expect(policyCategories?.[categoryNameToUpdate]?.pendingAction).toBeFalsy();
                                        expect(policyCategories?.[categoryNameToUpdate]?.pendingFields?.enabled).toBeFalsy();

                                        resolve();
                                    },
                                });
                            }),
                    )
            );
        });
    });

    describe('DeleteWorkspaceCategories', () => {
        it('Delete category', () => {
            const fakePolicy = createRandomPolicy(0);
            const fakeCategories = createRandomPolicyCategories(3);
            const categoryNameToDelete = Object.keys(fakeCategories)[0];
            const categoriesToDelete = [categoryNameToDelete];
            // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
            fetch.pause();
            return (
                Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${fakePolicy.id}`, fakePolicy)
                    .then(() => {
                        Onyx.set(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`, fakeCategories);
                    })
                    .then(() => {
                        Policy.deleteWorkspaceCategories(fakePolicy.id, categoriesToDelete);
                        return waitForBatchedUpdates();
                    })
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);

                                        expect(policyCategories?.[categoryNameToDelete]?.pendingAction).toBe(CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE);
                                        resolve();
                                    },
                                });
                            }),
                    )
                    // @ts-expect-error TODO: Remove this once TestHelper (https://github.com/Expensify/App/issues/25318) is migrated to TypeScript.
                    .then(fetch.resume)
                    .then(waitForBatchedUpdates)
                    .then(
                        () =>
                            new Promise<void>((resolve) => {
                                const connectionID = Onyx.connect({
                                    key: `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${fakePolicy.id}`,
                                    waitForCollectionCallback: false,
                                    callback: (policyCategories) => {
                                        Onyx.disconnect(connectionID);
                                        expect(policyCategories?.[categoryNameToDelete]).toBeFalsy();

                                        resolve();
                                    },
                                });
                            }),
                    )
            );
        });
    });
});

import _ from 'underscore';
import Onyx from 'react-native-onyx';
import * as PersistedRequests from '../actions/PersistedRequests';
import * as NetworkStore from './NetworkStore';
import * as NetworkEvents from './NetworkEvents';
import ONYXKEYS from '../../ONYXKEYS';
import * as ActiveClientManager from '../ActiveClientManager';
import processRequest from './processRequest';

let isPersistedRequestsQueueRunning = false;

/**
 * This method will get any persisted requests and fire them off in parallel to retry them.
 * If we get any jsonCode besides 407 the request is a success. It doesn't make sense to
 * continually retry things that have returned a response. However, we can retry any requests
 * with known networking errors like "Failed to fetch".
 *
 * @returns {Promise}
 */
function process() {
    const persistedRequests = PersistedRequests.getAll();

    // This sanity check is also a recursion exit point
    if (NetworkStore.getIsOffline() || _.isEmpty(persistedRequests)) {
        return Promise.resolve();
    }

    const tasks = _.map(persistedRequests, request => processRequest(request)
        .catch((error) => {
            // If a persisted request fails in flight we won't retry it again
            NetworkEvents.getLogger().info('Persisted request failed', false, {command: request.command, error: error.message});
            PersistedRequests.remove(request);
        }));

    // Do a recursive call in case the queue is not empty after processing the current batch
    return Promise.all(tasks)
        .then(process);
}

function flush() {
    if (isPersistedRequestsQueueRunning) {
        return;
    }

    // ONYXKEYS.PERSISTED_REQUESTS is shared across clients, thus every client/tab will have a copy
    // It is very important to only process the queue from leader client otherwise requests will be duplicated.
    if (!ActiveClientManager.isClientTheLeader()) {
        return;
    }

    isPersistedRequestsQueueRunning = true;

    // Ensure persistedRequests are read from storage before proceeding with the queue
    const connectionID = Onyx.connect({
        key: ONYXKEYS.PERSISTED_REQUESTS,
        callback: () => {
            Onyx.disconnect(connectionID);
            process()
                .finally(() => isPersistedRequestsQueueRunning = false);
        },
    });
}

// Flush the queue when the connection resumes
NetworkEvents.onConnectivityResumed(flush);

export {
    // eslint-disable-next-line import/prefer-default-export
    flush,
};

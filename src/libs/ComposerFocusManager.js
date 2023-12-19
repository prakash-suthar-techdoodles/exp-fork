import {TextInput} from 'react-native';
import _ from 'underscore';
import CONST from '@src/CONST';

let focusedInput = null;

function getActiveInput() {
    return TextInput.State.currentlyFocusedInput ? TextInput.State.currentlyFocusedInput() : TextInput.State.currentlyFocusedField();
}

function saveFocusedInput() {
    const activeInput = getActiveInput();
    if (activeInput) {
        focusedInput = activeInput;
    }
}

function clearFocusedInput() {
    if (!focusedInput) {
        return;
    }

    // we have to use timeout because of measureLayout
    setTimeout(() => (focusedInput = null), CONST.ANIMATION_IN_TIMING);
}

let uniqueModalId = 1;
const focusMap = new Map();
const activeModals = [];
const promiseMap = new Map();

// TODO:debug
global.demo = new Proxy(
    {
        obj: () => [...focusMap.values()],
        arr: () => activeModals,
        promise: () => [...promiseMap],
        el: () => focusedInput,
    },
    {
        get: (target, key) => target[key] && target[key](),
    },
);

function releaseInput(input) {
    if (!input) {
        return;
    }
    if (input === focusedInput) {
        focusedInput = null;
    }
    [...focusMap].forEach(([key, value]) => {
        if (value !== input) {
            return;
        }
        focusMap.delete(key);
    });
}

function getId() {
    return uniqueModalId++;
}

function saveFocusState(id, container) {
    // For popoverWithoutOverlay, react calls autofocus before useEffect.
    const input = focusedInput || getActiveInput();
    focusedInput = null;
    if (activeModals.indexOf(id) < 0) {
        activeModals.push(id);
    }
    if (!input) {
        return;
    }
    // TODO: can we refine this logic?
    if (container && container.contains(input)) {
        return;
    }
    focusMap.set(id, input);
    input.blur();
}

/**
 * If we intentionally clicked on another input box, there is no need to restore focus.
 * But if we are closing the RHP, we can ignore the focused input.
 *
 * @param {TextInput} input
 * @param {Boolean} shouldIgnoreFocused
 */
function focus(input, shouldIgnoreFocused = false) {
    if (shouldIgnoreFocused) {
        input.focus();
        return;
    }
    const activeInput = getActiveInput();
    if (activeInput) {
        return;
    }
    input.focus();
}

function restoreFocusState(id, type = CONST.MODAL.RESTORE_FOCUS_TYPE.DEFAULT, shouldIgnoreFocused = false) {
    // TODO:del
    console.debug(`restore ${id}, type is ${type}, active modals are`, activeModals.join());
    if (!id) {
        // TODO:del
        console.debug('todo id empty');
        return;
    }
    if (activeModals.length < 1) {
        // TODO:del
        console.debug('stack is empty');
        return;
    }
    const index = activeModals.indexOf(id);
    if (index < 0) {
        // TODO:del
        console.debug('activeModals does not contain this id');
        return;
    }
    activeModals.splice(index, 1);
    if (type === CONST.MODAL.RESTORE_FOCUS_TYPE.PRESERVE) {
        // TODO:del
        console.debug('preserve input focus');
        return;
    }
    if (type === CONST.MODAL.RESTORE_FOCUS_TYPE.DELETE) {
        // TODO:del
        console.debug('delete, no restore');
        focusMap.delete(id);
        return;
    }
    if (activeModals.length > index) {
        // this modal is not the topmost one, do not restore it.
        // TODO:del
        console.debug('modal is not the topmost one');
        return;
    }
    const input = focusMap.get(id);
    if (input) {
        focus(input, shouldIgnoreFocused);
        focusMap.delete(id);
        return;
    }

    if (focusMap.size < 1) {
        // TODO:del
        console.debug('obj is also empty, so return');
        return;
    }

    // find the topmost one
    const [lastKey, lastInput] = _.last([...focusMap]);
    if (!lastInput) {
        // TODO:del
        console.error('no, impossible');
        return;
    }
    // TODO:del
    console.debug('oh, try to restore topmost');
    focus(lastInput, shouldIgnoreFocused);
    focusMap.delete(lastKey);
}

function resetReadyToFocus(id) {
    // TODO:del
    console.debug('reset ready to focus', id);
    const obj = {};
    obj.ready = new Promise((resolve) => {
        obj.resolve = resolve;
    });
    promiseMap.set(id, obj);
}

function getKey(id) {
    if (id) {
        return id;
    }
    if (promiseMap.size < 1) {
        return 0;
    }
    return _.last([...promiseMap.keys()]);
}

function setReadyToFocus(id) {
    const key = getKey(id);
    const promise = promiseMap.get(key);
    // TODO:del
    console.debug('set ready to focus', id, key);
    if (!promise) {
        return;
    }
    promise.resolve();
    promiseMap.delete(key);
}

function removePromise(id) {
    // TODO:del
    console.debug('remove promise', id);
    const key = getKey(id);
    promiseMap.delete(key);
}

function isReadyToFocus(id) {
    const key = getKey(id);
    const promise = promiseMap.get(key);
    // TODO:del
    console.debug('is ready to focus', id, key, promise);
    if (!promise) {
        return Promise.resolve();
    }
    return promise.ready;
}

function tryRestoreFocusAfterClosedCompletely(id, restoreType) {
    isReadyToFocus(id).then(() => restoreFocusState(id, restoreType));
}

function tryRestoreFocusByExternal() {
    if (focusMap.size < 1) {
        return;
    }
    const [key, input] = _.last([...focusMap]);
    console.debug('oh, try to restore by external');
    input.focus();
    focusMap.delete(key);
}

export default {
    getId,
    saveFocusedInput,
    clearFocusedInput,
    releaseInput,
    saveFocusState,
    restoreFocusState,
    resetReadyToFocus,
    setReadyToFocus,
    isReadyToFocus,
    tryRestoreFocusAfterClosedCompletely,
    removePromise,
    tryRestoreFocusByExternal,
};

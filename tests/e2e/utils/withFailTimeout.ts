const {INTERACTION_TIMEOUT} = require('../config');

const TIMEOUT: number = process.env.INTERACTION_TIMEOUT ?? INTERACTION_TIMEOUT;

const withFailTimeout = (promise: Promise<void>, name: string): Promise<void> =>
    new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`[${name}] Interaction timed out after ${(TIMEOUT / 1000).toFixed(0)}s`));
        }, Number(TIMEOUT));

        promise
            .then((value) => {
                resolve(value);
            })
            .catch((e) => {
                reject(e);
            })
            .finally(() => {
                clearTimeout(timeoutId);
            });
    });

module.exports = withFailTimeout;

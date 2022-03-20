/**
 * Returns the decoded URI String. iOS expects file names without encoding
 * @param {bool} localFileUri which is fileUri coming in by default - from react native picker
 * @return {String}
 */

export default localFileUri => decodeURIComponent(localFileUri);

import React, {useState} from 'react';
import RNFetchBlob from 'react-native-blob-util';
import Share from 'react-native-share';
import type {Log} from '@libs/Console';
import localFileCreate from '@libs/localFileCreate';
import BaseClientSideLoggingToolMenu from './BaseClientSideLoggingToolMenu';
import type ClientSideLoggingToolMenuProps from './types';

function ClientSideLoggingToolMenu({isViaTestToolsModal = false, closeTestToolsModal}: ClientSideLoggingToolMenuProps) {
    const [file, setFile] = useState<{path: string; newFileName: string; size: number}>();

    const createAndSaveFile = (logs: Log[]) => {
        localFileCreate('logs', JSON.stringify(logs, null, 2)).then((localFile) => {
            RNFetchBlob.MediaCollection.copyToMediaStore(
                {
                    name: localFile.newFileName,
                    parentFolder: '',
                    mimeType: 'text/plain',
                },
                'Download',
                localFile.path,
            );
            setFile(localFile);
        });
    };

    const shareLogs = () => {
        if (!file) {
            return;
        }
        Share.open({
            url: `file://${file.path}`,
        });
    };

    return (
        <BaseClientSideLoggingToolMenu
            file={file}
            onEnableLogging={() => setFile(undefined)}
            onDisableLogging={createAndSaveFile}
            onShareLogs={shareLogs}
            isViaTestToolsModal={isViaTestToolsModal}
            closeTestToolsModal={closeTestToolsModal}
        />
    );
}

ClientSideLoggingToolMenu.displayName = 'ClientSideLoggingToolMenu';

export default ClientSideLoggingToolMenu;

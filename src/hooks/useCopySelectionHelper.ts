import {useEffect} from 'react';
import Clipboard from '@libs/Clipboard';
import KeyboardShortcut from '@libs/KeyboardShortcut';
import {htmlToMarkdown, htmlToText} from '@libs/parser';
import SelectionScraper from '@libs/SelectionScraper';
import CONST from '@src/CONST';

function copySelectionToClipboard() {
    const selection = SelectionScraper.getCurrentSelection();
    if (!selection) {
        return;
    }
    if (!Clipboard.canSetHtml()) {
        Clipboard.setString(htmlToMarkdown(selection));
        return;
    }
    Clipboard.setHtml(selection, htmlToText(selection));
}

export default function useCopySelectionHelper() {
    useEffect(() => {
        const copyShortcutConfig = CONST.KEYBOARD_SHORTCUTS.COPY;
        const unsubscribeCopyShortcut = KeyboardShortcut.subscribe(
            copyShortcutConfig.shortcutKey,
            copySelectionToClipboard,
            copyShortcutConfig.descriptionKey,
            [...copyShortcutConfig.modifiers],
            false,
        );

        return () => {
            unsubscribeCopyShortcut();
        };
    }, []);
}

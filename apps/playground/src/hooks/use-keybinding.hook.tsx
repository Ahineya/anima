import {useEffect} from 'react';

const caseInsensitiveEquals = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function useKeybinding(keybinding: string, callback: (e?: KeyboardEvent) => void, cancelInInputs = false, useInAppStates = ['default'], deps: any[] = []) {
    const appState = 'default';

    function keysMatch(key: string, e: KeyboardEvent) {
        if (caseInsensitiveEquals(key, 'delete') && caseInsensitiveEquals(e.key, 'backspace')) {
            return true;
        }

        if (caseInsensitiveEquals(key, 'shift') && e.shiftKey) {
            return true;
        }

        if (caseInsensitiveEquals(key, 'cmd') && (e.ctrlKey || e.metaKey)) {
            return true;
        }

        return caseInsensitiveEquals(key, e.key);
    }

    function valueMatches(e: KeyboardEvent) {
        const keys = keybinding?.split('-') ?? [];

        if (!['delete', 'shift', 'cmd'].includes(keys[0])) {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                return false;
            }
        }

        if (keys.includes('cmd') && !keys.includes('shift')) {
            if (e.shiftKey) {
                return false;
            }
        }

        return keys.length > 0 && keys.every((key) => keysMatch(key, e));
    }

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (cancelInInputs && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                return;
            }

            if (valueMatches(e) && useInAppStates.includes(appState)) {
                callback(e);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [keybinding, callback, ...deps]);
}

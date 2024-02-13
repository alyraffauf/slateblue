// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as debug from './debug.js';

import { SwitcherCommands } from './modules/SwitcherCommands.js';
import { SwitcherThemeCursor, SwitcherThemeGtk, SwitcherThemeIcon, SwitcherThemeShell } from './modules/SwitcherTheme.js';
import { Timer } from './modules/Timer.js';


export default class NightThemeSwitcher extends Extension {
    #modules = [];

    enable() {
        globalThis.NTSMetadata = this.metadata;

        debug.message('Enabling extension...');

        const timer = new Timer({ settings: this.getSettings(`${this.metadata['settings-schema']}.time`), openPrefs: this.openPrefs });
        this.#modules.push(timer);

        [
            new SwitcherThemeGtk({ timer, settings: this.getSettings(`${this.metadata['settings-schema']}.gtk-variants`) }),
            new SwitcherThemeIcon({ timer, settings: this.getSettings(`${this.metadata['settings-schema']}.icon-variants`) }),
            new SwitcherThemeShell({ timer, settings: this.getSettings(`${this.metadata['settings-schema']}.shell-variants`) }),
            new SwitcherThemeCursor({ timer, settings: this.getSettings(`${this.metadata['settings-schema']}.cursor-variants`) }),
            new SwitcherCommands({ timer, settings: this.getSettings(`${this.metadata['settings-schema']}.commands`) }),
        ].forEach(module => this.#modules.push(module));

        this.#modules.forEach(module => module.enable());

        debug.message('Extension enabled.');
    }

    disable() {
        // Extension won't be disabled in `unlock-dialog` session mode. This is
        // to enable the color scheme switch while the lock screen is displayed,
        // as the background image and the shell theme are visible in this mode.
        debug.message('Disabling extension...');

        this.#modules.forEach(module => module.disable());
        this.#modules = [];

        debug.message('Extension disabled.');

        delete globalThis.NTSMetadata;
    }
}

// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { ExtensionState } from 'resource:///org/gnome/shell/misc/extensionUtils.js';
import { extensionManager, setThemeStylesheet, loadTheme } from 'resource:///org/gnome/shell/ui/main.js';

import * as debug from '../debug.js';
import * as utils from '../utils.js';

import { Time } from '../enums/Time.js';

import { Switcher } from './Switcher.js';


/**
 * Function called to update the system theme when no settings exist.
 *
 * @callback noSettingsUpdateSystemThemeCallback
 * @param {Time} time New time.
 */


/**
 * The Theme Switcher sets the system theme according to the time, either via
 * provided settings or by running a callback function.
 *
 * It also listens to system theme changes to update the current variant setting.
 */
export class SwitcherTheme extends Switcher {
    #name;
    #timer;
    #settings;
    #systemSettings;
    #themeKey;
    #noSettingsUpdateSystemThemeCallback;

    #settingsConnections = [];

    /**
     * @param {object} params Params object.
     * @param {string} params.name Name of the switcher.
     * @param {Timer} params.timer Timer to listen to.
     * @param {Gio.Settings} params.settings Settings with the `enabled`, `day` and `night` keys.
     * @param {Gio.Settings} [params.systemSettings] System settings containing the theme name.
     * @param {string} params.themeKey Settings key of the theme name.
     * @param {noSettingsUpdateSystemThemeCallback} params.noSettingsUpdateSystemThemeCallback function.
     */
    constructor({ name, timer, settings, systemSettings = null, themeKey, noSettingsUpdateSystemThemeCallback = null }) {
        super({
            name,
            timer,
            settings,
            callback: time => this.#onTimeChanged(time),
        });
        this.#name = name;
        this.#timer = timer;
        this.#settings = settings;
        this.#systemSettings = systemSettings;
        this.#themeKey = themeKey;
        this.#noSettingsUpdateSystemThemeCallback = noSettingsUpdateSystemThemeCallback;
    }

    enable() {
        if (this.#settings.get_boolean('enabled'))
            this.#connectSettings();
        super.enable();
    }

    disable() {
        this.#disconnectSettings();
        super.disable();
    }

    set systemSettings(settings) {
        if (settings === this.#systemSettings)
            return;
        this.#systemSettings = settings;
        this.disable();
        this.enable();
    }

    #connectSettings() {
        debug.message(`Connecting ${this.#name} switcher to settings...`);
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::day', this.#onDayVariantChanged.bind(this)),
        });
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::night', this.#onNightVariantChanged.bind(this)),
        });
        if (!this.#systemSettings)
            return;
        this.#settingsConnections.push({
            settings: this.#systemSettings,
            id: this.#systemSettings.connect(`changed::${this.#themeKey}`, this.#onSystemThemeChanged.bind(this)),
        });
    }

    #disconnectSettings() {
        this.#settingsConnections.forEach(({ settings, id }) => settings.disconnect(id));
        this.#settingsConnections = [];
        debug.message(`Disconnected ${this.#name} switcher from settings.`);
    }


    #onDayVariantChanged() {
        debug.message(`Day ${this.#name} variant changed to '${this.#settings.get_string('day')}'.`);
        this.#updateSystemTheme();
    }

    #onNightVariantChanged() {
        debug.message(`Night ${this.#name} variant changed to '${this.#settings.get_string('night')}'.`);
        this.#updateSystemTheme();
    }

    #onSystemThemeChanged() {
        debug.message(`System ${this.#name} changed to '${this.#systemSettings.get_string(this.#themeKey)}'.`);
        this.#updateCurrentVariant();
    }

    #onTimeChanged(_time) {
        this.#updateSystemTheme();
    }


    #updateCurrentVariant() {
        if (this.#timer.time === Time.UNKNOWN || !this.#systemSettings)
            return;
        this.#settings.set_string(this.#timer.time, this.#systemSettings.get_string(this.#themeKey));
    }

    #updateSystemTheme() {
        if (this.#timer.time === Time.UNKNOWN)
            return;
        debug.message(`Setting the ${this.#timer.time} ${this.#name} variant...`);
        if (this.#systemSettings)
            this.#systemSettings.set_string(this.#themeKey, this.#settings.get_string(this.#timer.time));
        else if (this.#noSettingsUpdateSystemThemeCallback)
            this.#noSettingsUpdateSystemThemeCallback(this.#timer.time);
    }
}


export class SwitcherThemeCursor extends SwitcherTheme {
    /**
     * @param {object} params Params object.
     * @param {Timer} params.timer Timer to listen to.
     * @param {Gio.Settings} params.settings Cursor theme settings.
     */
    constructor({ timer, settings }) {
        super({
            name: 'Cursor theme',
            timer,
            settings,
            systemSettings: new Gio.Settings({ schema: 'org.gnome.desktop.interface' }),
            themeKey: 'cursor-theme',
        });
    }
}


export class SwitcherThemeGtk extends SwitcherTheme {
    /**
     * @param {object} params Params object.
     * @param {Timer} params.timer Timer to listen to.
     * @param {Gio.Settings} params.settings GTK theme settings.
     */
    constructor({ timer, settings }) {
        super({
            name: 'GTK theme',
            timer,
            settings,
            systemSettings: new Gio.Settings({ schema: 'org.gnome.desktop.interface' }),
            themeKey: 'gtk-theme',
        });
    }
}


export class SwitcherThemeIcon extends SwitcherTheme {
    /**
     * @param {object} params Params object.
     * @param {Timer} params.timer Timer to listen to.
     * @param {Gio.Settings} params.settings Icon theme settings.
     */
    constructor({ timer, settings }) {
        super({
            name: 'Icon theme',
            timer,
            settings,
            systemSettings: new Gio.Settings({ schema: 'org.gnome.desktop.interface' }),
            themeKey: 'icon-theme',
        });
    }
}


export class SwitcherThemeShell extends SwitcherTheme {
    #settings;
    #extensionManagerConnection = null;

    /**
     * @param {object} params Params object.
     * @param {Timer} params.timer Timer to listen to.
     * @param {Gio.Settings} params.settings Shell theme settings.
     */
    constructor({ timer, settings }) {
        super({
            name: 'Shell theme',
            timer,
            settings,
            systemSettings: getUserthemesSettings(),
            themeKey: 'name',
            noSettingsUpdateSystemThemeCallback: time => this.#noSettingsUpdateSystemThemeCallback(time),
        });
        this.#settings = settings;
    }

    enable() {
        super.enable();
        this.#extensionManagerConnection = extensionManager.connect('extension-state-changed', this.#onExtensionStateChanged.bind(this));
    }

    disable() {
        super.disable();
        if (this.#extensionManagerConnection) {
            extensionManager.disconnect(this.#extensionManagerConnection);
            this.#extensionManagerConnection = null;
        }
    }

    #noSettingsUpdateSystemThemeCallback(time) {
        const shellTheme = this.#settings.get_string(time);
        const stylesheet = getShellThemeStylesheet(shellTheme);
        applyShellStylesheet(stylesheet);
    }

    #onExtensionStateChanged() {
        this.systemSettings = getUserthemesSettings();
    }
}


/**
 * Get the User Themes extension.
 *
 * @returns {object|undefined} The User Themes extension object or undefined if
 * it isn't installed.
 */
function getUserthemesExtension() {
    try {
        return extensionManager.lookup('user-theme@gnome-shell-extensions.gcampax.github.com');
    } catch (_e) {
        return undefined;
    }
}

/**
 * Get the User Themes extension settings.
 *
 * @returns {Gio.Settings|null} The User Themes extension settings or null if
 * the extension isn't installed.
 */
function getUserthemesSettings() {
    let extension = getUserthemesExtension();
    if (!extension || extension.state !== ExtensionState.ENABLED)
        return null;
    const schemaDir = extension.dir.get_child('schemas');
    const GioSSS = Gio.SettingsSchemaSource;
    let schemaSource;
    if (schemaDir.query_exists(null))
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
    else
        schemaSource = GioSSS.get_default();
    const schemaObj = schemaSource.lookup('org.gnome.shell.extensions.user-theme', true);
    return new Gio.Settings({ settings_schema: schemaObj });
}

/**
 * Get the shell theme stylesheet.
 *
 * @param {string} theme The shell theme name.
 * @returns {string|null} Path to the shell theme stylesheet.
 */
function getShellThemeStylesheet(theme) {
    const themeName = theme ? `'${theme}'` : 'default';
    debug.message(`Getting the ${themeName} theme shell stylesheet...`);
    let stylesheet = null;
    if (theme) {
        const stylesheetPaths = utils.getResourcesDirsPaths('themes').map(path => GLib.build_filenamev([path, theme, 'gnome-shell', 'gnome-shell.css']));
        stylesheet = stylesheetPaths.find(path => {
            const file = Gio.file_new_for_path(path);
            return file.query_exists(null);
        });
    }
    return stylesheet;
}

/**
 * Apply a stylesheet to the shell.
 *
 * @param {string} stylesheet The shell stylesheet to apply.
 */
function applyShellStylesheet(stylesheet) {
    debug.message('Applying shell stylesheet...');
    setThemeStylesheet(stylesheet);
    loadTheme();
    debug.message('Shell stylesheet applied.');
}

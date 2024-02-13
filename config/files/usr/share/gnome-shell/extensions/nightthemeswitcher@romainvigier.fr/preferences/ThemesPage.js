// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as utils from '../utils.js';

import { DropDownChoice } from './DropDownChoice.js';


export class ThemesPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass({
            GTypeName: 'ThemesPage',
            Template: 'resource:///org/gnome/Shell/Extensions/nightthemeswitcher/preferences/ui/ThemesPage.ui',
            InternalChildren: [
                'gtk_row',
                'gtk_day_variant_combo_row',
                'gtk_night_variant_combo_row',
                'shell_row',
                'shell_day_variant_combo_row',
                'shell_night_variant_combo_row',
                'icon_row',
                'icon_day_variant_combo_row',
                'icon_night_variant_combo_row',
                'cursor_row',
                'cursor_day_variant_combo_row',
                'cursor_night_variant_combo_row',
            ],
        }, this);
    }

    constructor({ gtkSettings, shellSettings, iconSettings, cursorSettings, ...params } = {}) {
        super(params);

        gtkSettings.bind('enabled', this._gtk_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const gtkThemesStore = Gio.ListStore.new(DropDownChoice);
        gtkThemesStore.splice(0, 0, Array.from(utils.getInstalledGtkThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._gtk_day_variant_combo_row, gtkThemesStore, gtkSettings, 'day');
        _setupComboRow(this._gtk_night_variant_combo_row, gtkThemesStore, gtkSettings, 'night');

        shellSettings.bind('enabled', this._shell_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const shellThemesStore = Gio.ListStore.new(DropDownChoice);
        shellThemesStore.splice(0, 0, Array.from(utils.getInstalledShellThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme || _('Default') })));
        _setupComboRow(this._shell_day_variant_combo_row, shellThemesStore, shellSettings, 'day');
        _setupComboRow(this._shell_night_variant_combo_row, shellThemesStore, shellSettings, 'night');

        iconSettings.bind('enabled', this._icon_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const iconThemesStore = Gio.ListStore.new(DropDownChoice);
        iconThemesStore.splice(0, 0, Array.from(utils.getInstalledIconThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._icon_day_variant_combo_row, iconThemesStore, iconSettings, 'day');
        _setupComboRow(this._icon_night_variant_combo_row, iconThemesStore, iconSettings, 'night');

        cursorSettings.bind('enabled', this._cursor_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const cursorThemesStore = Gio.ListStore.new(DropDownChoice);
        cursorThemesStore.splice(0, 0, Array.from(utils.getInstalledCursorThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._cursor_day_variant_combo_row, cursorThemesStore, cursorSettings, 'day');
        _setupComboRow(this._cursor_night_variant_combo_row, cursorThemesStore, cursorSettings, 'night');
    }
}


/**
 * Set up the model of a combo row.
 *
 * @param {Adw.ComboRow} row The row to set up.
 * @param {Gio.ListModel} model A list model of DropDownChoice.
 * @param {Gio.Settings} settings The settings to connect.
 * @param {str} key The key to update.
 */
function _setupComboRow(row, model, settings, key) {
    row.model = model;
    row.expression = Gtk.PropertyExpression.new(DropDownChoice, null, 'title');
    row.connect('notify::selected-item', () => settings.set_string(key, row.selected_item.id));
    const updateComboRowSelected = () => {
        row.selected = utils.findItemPositionInModel(row.model, item => item.id === settings.get_string(key));
    };
    settings.connect(`changed::${key}`, () => updateComboRowSelected());
    updateComboRowSelected();
}

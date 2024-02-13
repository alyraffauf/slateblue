// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class NightThemeSwitcherPreferences extends ExtensionPreferences {
    /**
     * Fill the PreferencesWindow.
     *
     * @param {Adw.PreferencesWindow} window The PreferencesWindow to fill.
     */
    async fillPreferencesWindow(window) {
        // Load resources
        const resource = Gio.Resource.load(GLib.build_filenamev([this.path, 'resources', 'preferences.gresource']));
        Gio.resources_register(resource);

        // Load icons
        const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        iconTheme.add_resource_path('/org/gnome/Shell/Extensions/nightthemeswitcher/preferences/icons');

        // Set window properties
        window.search_enabled = true;
        window.set_default_size(640, 600);

        // Add a dummy page until the dynamics imports are done
        const dummyPage = new Adw.PreferencesPage();
        window.add(dummyPage);

        // Dynamically import all classes
        const { BackgroundButton } = await import('./preferences/BackgroundButton.js');
        const { BackgroundsPage } = await import('./preferences/BackgroundsPage.js');
        const { ClearableEntry } = await import('./preferences/ClearableEntry.js');
        const { CommandsPage } = await import('./preferences/CommandsPage.js');
        const { ContributePage } = await import('./preferences/ContributePage.js');
        const { DropDownChoice } = await import('./preferences/DropDownChoice.js');
        const { SchedulePage } = await import('./preferences/SchedulePage.js');
        const { ShortcutButton } = await import('./preferences/ShortcutButton.js');
        const { ThemesPage } = await import('./preferences/ThemesPage.js');
        const { TimeChooser } = await import('./preferences/TimeChooser.js');

        // Make sure all GObjects are registered
        GObject.type_ensure(BackgroundButton);
        GObject.type_ensure(BackgroundsPage);
        GObject.type_ensure(ClearableEntry);
        GObject.type_ensure(CommandsPage);
        GObject.type_ensure(ContributePage);
        GObject.type_ensure(DropDownChoice);
        GObject.type_ensure(SchedulePage);
        GObject.type_ensure(ShortcutButton);
        GObject.type_ensure(ThemesPage);
        GObject.type_ensure(TimeChooser);

        // Remove the dummy page
        window.remove(dummyPage);

        // Add all pages
        [
            new SchedulePage({ settings: this.getSettings(`${this.metadata['settings-schema']}.time`) }),
            new BackgroundsPage(),
            new CommandsPage({ settings: this.getSettings(`${this.metadata['settings-schema']}.commands`) }),
            new ThemesPage({
                gtkSettings: this.getSettings(`${this.metadata['settings-schema']}.gtk-variants`),
                shellSettings: this.getSettings(`${this.metadata['settings-schema']}.shell-variants`),
                iconSettings: this.getSettings(`${this.metadata['settings-schema']}.icon-variants`),
                cursorSettings: this.getSettings(`${this.metadata['settings-schema']}.cursor-variants`),
            }),
            new ContributePage(),
        ].forEach(page => window.add(page));
    }
}

// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';


export class ClearableEntry extends Gtk.Entry {
    static {
        GObject.registerClass({
            GTypeName: 'ClearableEntry',
            Template: 'resource:///org/gnome/Shell/Extensions/nightthemeswitcher/preferences/ui/ClearableEntry.ui',
        }, this);
    }

    onIconReleased(entry, position) {
        if (position === Gtk.EntryIconPosition.SECONDARY)
            entry.text = '';
    }
}

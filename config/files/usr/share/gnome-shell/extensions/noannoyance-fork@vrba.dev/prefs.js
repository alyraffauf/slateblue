// Based on https://github.com/ubuntu/gnome-shell-extension-appindicator

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Adw from 'gi://Adw';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const WMCLASS_LIST = 'by-class';
const IGNORELIST_ENABLED = 'enable-ignorelist';

export default class Preferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'dialog-information-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: 'Settings',
        });
        page.add(group);

        let toggle = new Adw.SwitchRow({
            title: "Enable Ignorelist",
        });

        group.add(toggle);

        settings.bind(
            IGNORELIST_ENABLED,
            toggle,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        let expander = new Adw.ExpanderRow({
            title: 'WM__CLASS List ("Alt + F2" > Run "lg" > Click "Windows")',
        });

        const customListStore = new Gtk.ListStore();
        customListStore.set_column_types([GObject.TYPE_STRING]);
        const customInitArray = settings.get_strv(WMCLASS_LIST);
        for (let i = 0; i < customInitArray.length; i++) {
            customListStore.set(customListStore.append(), [0], [customInitArray[i]]);
        }
        customListStore.append();

        const customTreeView = new Gtk.TreeView({
            model: customListStore,
            hexpand: true,
            vexpand: true,
        });

        const indicatorIdColumn = new Gtk.TreeViewColumn({
            title: 'Name',
            sizing: Gtk.TreeViewColumnSizing.AUTOSIZE,
        });

        const cellrenderer = new Gtk.CellRendererText({
            editable: true,
        });

        indicatorIdColumn.pack_start(cellrenderer, true);
        indicatorIdColumn.add_attribute(cellrenderer, "text", 0);
        customTreeView.insert_column(indicatorIdColumn, 0);
        customTreeView.set_grid_lines(Gtk.TreeViewGridLines.BOTH);

        expander.add_suffix(customTreeView);
        group.add(expander);

        cellrenderer.connect("edited", (w, path, text) => {
            this.selection = customTreeView.get_selection();
            const selection = this.selection.get_selected();
            const iter = selection[2];

            customListStore.set(iter, [0], [text]);
            const storeLength = customListStore.iter_n_children(null);
            const customIconArray = [];

            for (let i = 0; i < storeLength; i++) {
                const returnIter = customListStore.iter_nth_child(null, i);
                const [success, iterList] = returnIter;
                if (!success) break;

                if (iterList) {
                    const id = customListStore.get_value(iterList, 0);
                    if (id) customIconArray.push(id);
                } else {
                    break;
                }
            }
            settings.set_strv(WMCLASS_LIST, customIconArray);

            if (storeLength === 1 && text) customListStore.append();

            if (storeLength > 1) {
                if (!text && storeLength - 1 > path) customListStore.remove(iter);
                if (text && storeLength - 1 <= path) customListStore.append();
            }
        });

        window.add(page);
    }
}

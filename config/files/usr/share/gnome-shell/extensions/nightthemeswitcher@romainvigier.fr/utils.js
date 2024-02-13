// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';


/**
 * Get all the directories of the system for a resource.
 *
 * @param {string} resource The resource to get the directories.
 * @returns {string[]} An array of paths.
 */
export function getResourcesDirsPaths(resource) {
    return [
        GLib.build_filenamev([GLib.get_home_dir(), `.${resource}`]),
        GLib.build_filenamev([GLib.get_user_data_dir(), resource]),
        ...GLib.get_system_data_dirs().map(path => GLib.build_filenamev([path, resource])),
    ];
}

/**
 * Get all the resources installed on the system.
 *
 * @param {string} type The resources to get.
 * @returns {Set} A set of installed resources.
 */
function getInstalledResources(type) {
    const installedResources = new Set();
    getResourcesDirsPaths(type).forEach(resourcesDirPath => {
        const resourcesDir = Gio.File.new_for_path(resourcesDirPath);
        if (resourcesDir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY)
            return;
        const resourcesDirsEnumerator = resourcesDir.enumerate_children('standard::', Gio.FileQueryInfoFlags.NONE, null);
        while (true) {
            let resourceDirInfo = resourcesDirsEnumerator.next_file(null);
            if (resourceDirInfo === null)
                break;
            const resourceDir = resourcesDirsEnumerator.get_child(resourceDirInfo);
            if (resourceDir === null)
                continue;
            const resource = new Map([
                ['name', resourceDir.get_basename()],
                ['path', resourceDir.get_path()],
            ]);
            installedResources.add(resource);
        }
        resourcesDirsEnumerator.close(null);
    });
    return installedResources;
}

/**
 * Get all the installed GTK themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed GTK themes names.
 */
export function getInstalledGtkThemes() {
    const themes = new Set();
    getInstalledResources('themes').forEach(theme => {
        const version = [0, Gtk.MINOR_VERSION].find(gtkVersion => {
            if (gtkVersion % 2)
                gtkVersion += 1;
            const cssFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), `gtk-3.${gtkVersion}`, 'gtk.css']));
            return cssFile.query_exists(null);
        });
        if (version !== undefined)
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Get all the installed shell themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed shell themes names.
 */
export function getInstalledShellThemes() {
    const themes = new Set(['']);
    getInstalledResources('themes').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'gnome-shell', 'gnome-shell.css']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Get all the installed icon themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed icon themes names.
 */
export function getInstalledIconThemes() {
    const themes = new Set();
    getInstalledResources('icons').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'index.theme']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    themes.delete('default');
    return themes;
}

/**
 * Get all the installed cursor themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed cursor themes names.
 */
export function getInstalledCursorThemes() {
    const themes = new Set();
    getInstalledResources('icons').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'cursors']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Find an item in a `Gio.ListModel`.
 *
 * @param {Gio.ListModel} model The ListModel to search.
 * @param {Function} findFunction The function used to find the item. Gets the item as argument.
 * @returns {(*|undefined)} The found item or `undefined`.
 */
export function findItemPositionInModel(model, findFunction) {
    const nItems = model.get_n_items();
    for (let i = 0; i < nItems; i++) {
        if (findFunction(model.get_item(i)))
            return i;
    }
    return undefined;
}

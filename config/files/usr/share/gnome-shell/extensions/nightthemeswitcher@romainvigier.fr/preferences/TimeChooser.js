// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';


export class TimeChooser extends Gtk.Box {
    static {
        GObject.registerClass({
            GTypeName: 'TimeChooser',
            Template: 'resource:///org/gnome/Shell/Extensions/nightthemeswitcher/preferences/ui/TimeChooser.ui',
            InternalChildren: ['hours', 'minutes'],
            Properties: {
                time: GObject.ParamSpec.double(
                    'time',
                    'Time',
                    'The time of the chooser',
                    GObject.ParamFlags.READWRITE,
                    0,
                    24,
                    0
                ),
            },
        }, this);
    }

    onTimeChanged(chooser) {
        const hours = Math.trunc(chooser.time);
        const minutes = Math.round((chooser.time - hours) * 60);
        chooser._hours.value = hours;
        chooser._minutes.value = minutes;
    }

    onValueChanged(_spin) {
        const hours = this._hours.value;
        const minutes = this._minutes.value / 60;
        this.time = hours + minutes;
    }

    onOutputChanged(spin) {
        spin.text = spin.value.toString().padStart(2, '0');
        return true;
    }
}

// SPDX-FileCopyrightText: Night Theme Switcher Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GObject from 'gi://GObject';


export class DropDownChoice extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'DropDownChoice',
            Properties: {
                id: GObject.ParamSpec.string(
                    'id',
                    'ID',
                    'Identifier',
                    GObject.ParamFlags.READWRITE,
                    null
                ),
                title: GObject.ParamSpec.string(
                    'title',
                    'Title',
                    'Displayed title',
                    GObject.ParamFlags.READWRITE,
                    null
                ),
                enabled: GObject.ParamSpec.boolean(
                    'enabled',
                    'Enabled',
                    'If the choice is enabled',
                    GObject.ParamFlags.READWRITE,
                    true
                ),
            },
        }, this);
    }
}

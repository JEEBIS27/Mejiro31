// SPDX-License-Identifier: GPL-3.0-or-later
// Mejiro31 site extension, carried by VIA's custom Raw HID handler.
// Request: FA 01 op (0=get, 1=set), bytes 4..11="M31WEB01".
// Response: same header, byte 3=status (0=ok,1=locked,2=invalid,3=busy).
// Settings: byte12 flags (JIS=1, alternative=2, Mejiro=4), 13 EN, 14 JP.
#pragma once
#include "web_layouts.h"
#include "via.h"
// A different firmware build resets both its keymap and initial layout choices.
void via_init_kb(void) {
    if (!via_eeprom_is_valid()) eeconfig_init_user();
}
// The unified engine consumes raw positions before Vial's normal keycode
// gate. Mirror its unlock barrier, including keys released during the dialog.
static bool web_unlock_paused;
static bool web_pause_for_unlock(void) {
    if (!vial_unlock_in_progress) {
        web_unlock_paused = false;
        return false;
    }
    if (!web_unlock_paused) switch_context();
    web_unlock_paused = true;
    return true;
}
static void web_reply(uint8_t *data, uint8_t status) {
    data[3] = status;
    data[12] = input.layout.jis_host | (input.layout.alt_enabled << 1) | (mejiro_mode << 2);
    data[13] = web_en_layout;
    data[14] = web_jp_layout;
    data[15] = MJI_EN_PROFILE;
    data[16] = DYNAMIC_KEYMAP_LAYER_COUNT;
    data[17] = WEB_LAYOUT_COUNT;
}
void raw_hid_receive_kb(uint8_t *data, uint8_t length) {
    if (length != 32 || data[0] != 0xfa || data[1] != 1 || memcmp(data + 4, "M31WEB01", 8)) {
        data[0] = 0xff;
        return;
    }
    if (!ready) { web_reply(data, 3); return; }
    if (data[2] == 0) { web_reply(data, 0); return; }
    if (data[2] != 1 || data[12] > 7 || data[13] >= WEB_LAYOUT_COUNT || data[14] >= WEB_LAYOUT_COUNT) {
        web_reply(data, 2); return;
    }
    if (!vial_unlocked) { web_reply(data, 1); return; }
    // Configuration changes release existing output and suppress held switches.
    mji_layout_config_t config = input.layout;
    config.jis_host = (data[12] & 1) != 0;
    config.alt_enabled = (data[12] & 2) != 0;
    config.maps[0] = web_layouts[data[13]];
    config.maps[1] = web_layouts[data[14]];
    if (!select_layout(&config)) { web_reply(data, 2); return; }
    web_en_layout = data[13];
    web_jp_layout = data[14];
    mejiro_mode = (data[12] & 4) != 0;
    switch_context();
    save_settings();
    web_reply(data, 0);
}

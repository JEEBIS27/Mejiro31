// SPDX-License-Identifier: GPL-3.0-or-later
// Run the pinned keyboard's adapter regressions and our real protocol handler.
#include "adapter_fixture.c"
int vial_unlocked;
int vial_unlock_in_progress;
static bool eeprom_valid = true;
bool via_eeprom_is_valid(void) { return eeprom_valid; }
static void request(uint8_t *packet, uint8_t op, uint8_t flags, uint8_t en, uint8_t jp) {
    memset(packet, 0, 32);
    packet[0] = 0xfa; packet[1] = 1; packet[2] = op;
    memcpy(packet + 4, "M31WEB01", 8);
    packet[12] = flags; packet[13] = en; packet[14] = jp;
    raw_hid_receive_kb(packet, 32);
}
static void test_web_protocol(void) {
    setup();
    uint8_t packet[32];
    vial_unlocked = 0;
    request(packet, 0, 0, 0, 0);
    assert(packet[3] == 0 && packet[12] == (2 | (MJI_DEFAULT_MEJIRO ? 4 : 0)) && packet[16] == 12 && packet[17] == WEB_LAYOUT_COUNT);
    uint32_t saved = settings_word;
    request(packet, 1, 7, 1, 16);
    assert(packet[3] == 1 && settings_word == saved);
    vial_unlocked = 1;
    request(packet, 1, 6, WEB_LAYOUT_COUNT, 0);
    assert(packet[3] == 2 && settings_word == saved);
    // Hold a real key while changing context: no stuck output may survive.
    event(0, 1, true); tick(200);
    request(packet, 1, 7, 1, 16);
    assert(packet[3] == 0 && packet[13] == 1 && packet[14] == 16);
    assert(input.layout.jis_host && input.layout.alt_enabled && mejiro_mode);
    assert(input.ignored & (UINT64_C(1) << 1));
    all_up(); event(201, 1, false);
    keyboard_post_init_user();
    assert(web_en_layout == 1 && web_jp_layout == 16);
    assert(input.layout.maps[0].entries == mji_layout_graphite);
    assert(input.layout.maps[1].entries == mji_layout_o24);
    // Test that a site-selected runtime map actually changes emitted keys.
    event(300, 1, true); tick(500);
    assert(native_keys[KC_B]); // Graphite maps Q -> B.
    event(501, 1, false); all_up();
    packet[0] = 0xfa; packet[1] = 2;
    raw_hid_receive_kb(packet, 32); assert(packet[0] == 0xff);
    setup(); request(packet, 0, 0, 0, 0); // Ready flag is checked before all writes.
    ready = false; request(packet, 1, 6, 0, 0); assert(packet[3] == 3);
    eeprom_valid = false; via_init_kb();
    assert(((settings_word >> 3) & 31) == MJI_WEB_EN_DEFAULT);
    assert(((settings_word >> 8) & 31) == MJI_WEB_JP_DEFAULT);
    puts("site protocol identity, lock, validation, context barrier, persisted layouts and real key output OK");
}
static void test_unlock_barrier(void) {
    setup();
    event(0, 1, true); tick(200); assert(native_keys[KC_Q]);
    vial_unlock_in_progress = 1;
    tick(201); all_up();
    event(202, 0, true);
    event(203, 11, true);
    tick(500); all_up();
    event(501, 1, false);
    event(502, 0, false);
    assert(!(input.physical & 3));
    vial_unlock_in_progress = 0;
    tick(503); all_up();
    assert(input.ignored & (UINT64_C(1) << 11));
    event(504, 11, false); all_up();
    event(600, 1, true); tick(800);
    assert(native_keys[KC_Q]);
    event(801, 1, false); all_up();
    puts("unlock barrier suppresses engine output, tracks releases and resumes input OK");
}
int main(void) {
    assert(adapter_regression_main() == 0);
    test_web_protocol();
    test_unlock_barrier();
    return 0;
}

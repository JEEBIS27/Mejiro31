#include QMK_KEYBOARD_H
#include "os_detection.h"
#include "a2j/translate_ansi_to_jis.h"

// レイヤー定義（enumの値を0から連番で確保する）
enum layer_names {
    _QWERTY = 0,
    _GEMINI,
    _NUMBER,
    _FUNCTION,
};
enum custom_keycodes {
    KC_DZ = SAFE_RANGE,  // 00キー
    TG_JIS,  // JISモード切替キー
};

#define MT_SPC MT(MOD_LSFT, KC_SPC)  // タップでSpace、ホールドでShift
#define MT_ENT MT(MOD_LSFT, KC_ENT)  // タップでEnter、ホールドでShift
#define MT_ESC MT(MOD_LGUI, KC_ESC)  // タップでEscape、ホールドでGUI
#define MO_FUN MO(_FUNCTION)  // ホールドで_FUNCTIONレイヤー
#define MT_TGL LT(_NUMBER, KC_F24)  // タップで_GEMINIレイヤー切替、ホールドで_NUMBERレイヤー

static uint16_t default_layer = 0; // デフォルトレイヤー状態を保存する変数 (0:_QWERTY, 1: _GEMINI)
static bool is_jis_mode = true; // JISモード判定フラグ

bool process_record_user(uint16_t keycode, keyrecord_t *record) {

    os_variant_t os = detected_host_os();
    bool is_mac = (os == OS_MACOS || os == OS_IOS);

    bool ime_mod_pressed = get_mods() & (MOD_BIT(KC_LALT) | MOD_BIT(KC_LCTL) | MOD_BIT(KC_RALT) | MOD_BIT(KC_RCTL));
    
    switch (keycode) {
        case MT_TGL:  // MT_TGLキー
            if (record->tap.count > 0) {
                if (record->event.pressed) {
                    // _QWERTY と _GEMINI の間でトグル切り替えを行う
                    if (default_layer == 0) {
                        set_single_persistent_default_layer(_GEMINI);
                        tap_code16(is_mac ? KC_LNG1 : KC_INT4); // Macなら「かな」キー、Windowsなら「変換」キーを送信
                        default_layer = 1;
                    } else {
                        set_single_persistent_default_layer(_QWERTY);
                        tap_code16(is_mac ? KC_LNG2 : KC_INT5); // Macなら「英数」キー、Windowsなら「無変換」キーを送信
                        default_layer = 0;
                    }
                }
                return false;
            }
            return true;
        case KC_DZ:
            if (record->event.pressed) {
                // 押された瞬間に0を2回送信
                SEND_STRING("00");
            }
            return true;
        case TG_JIS:
            if (record->event.pressed) {
                // 押された瞬間にJISモードをトグル
                is_jis_mode = !is_jis_mode;
            }
            return false;
        case KC_GRV:
            if(is_jis_mode) {
                if (ime_mod_pressed) {
                    return true;
                }
                else{
                    break;
                }
            }
            break;
        case KC_LCTL:
            if (is_mac) {
                // Macの場合はCommandとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LGUI);
                } else {
                    unregister_code(KC_LGUI);
                }
                return false;
            }
            return true;
        case KC_LGUI:
            if (is_mac) {
                // Macの場合はControlとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LCTL);
                } else {
                    unregister_code(KC_LCTL);
                }
                return false;
            }
            return true;
        default:
            break;
    }
    // Mod-Tapキーのホールド時にLCTL・LGUIが割り当てられている場合の処理
    if ((keycode >= QK_MOD_TAP && keycode <= QK_MOD_TAP_MAX)) {
    // ホールド時の修飾キーが LCTL であるか確認
        if (QK_MOD_TAP_GET_MODS(keycode) == MOD_LCTL) {
            if (is_mac) {
                if (record->event.pressed) {
                    if (record->tap.count > 0) {
                        return true; // タップ時は通常のキーを送信
                    } else {
                        register_code(KC_LGUI); // Macなら Command を送信
                        return false;
                    }
                } else {
                    unregister_code(KC_LGUI);
                    return true; // 離した時のタップ処理は QMK 本体に任せる
                }
            }
        }
        // ホールド時の修飾キーが LGUI であるか確認
        else if (QK_MOD_TAP_GET_MODS(keycode) == MOD_LGUI) {
            if (is_mac) {
                if (record->event.pressed) {
                    if (record->tap.count > 0) {
                        return true; // タップ時は通常のキーを送信
                    } else {
                        register_code(KC_LCTL); // Macなら Control を送信
                        return false;
                    }
                } else {
                    unregister_code(KC_LCTL);
                    return true; // 離した時のタップ処理は QMK 本体に任せる
                }
            }
        }
    }
    // JISモードの場合、ANSIからJISへの変換処理を呼び出す
    if (is_jis_mode) {
        return process_record_user_a2j(keycode, record); 
    }
    
    // JISモードでない場合は、通常のQMK処理を続行させる
    return true;
}

// ..................................................................... Keymaps
//
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    // QWERTY
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  q  │  w  │  e  │  r  │  t  │             │  y DEL u  │  i  │  o  │  p  │  -  │
    // ├─────┼──a──┼──s──┼──d──┼──f──┼──g──┤             ├──h──┼──j──┼──k──┼──l──┼──;──┼──'──┤
    // │ ESC │  z  │  x  │  c  │  v TAB b  │             │  n BSP m  │  ,  │  .  │  /  │  \  │
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │  [  =  ]  │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_QWERTY] = LAYOUT(
        KC_GRV,  KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,    KC_Y,    KC_U,    KC_I,    KC_O,    KC_P,    KC_MINS,
        MT_ESC,  KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,    KC_N,    KC_M,    KC_COMM, KC_DOT,  KC_SLSH, KC_BSLS,
                                            MT_SPC , MT_TGL,  MT_ENT,
                                            KC_LALT, KC_LCTL, KC_LBRC, KC_RBRC
    ),
    // GEMINI
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  #  │  S  │  T  │  P  │  H  │  *  │             │  *  │  F  │  P  │  L  │  T  │  D  │
    // ├─────┼─────┼─────┼─────┼─────┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │  #  │  S  │  K  │  W  │  R  │  *  │             │  *  │  R  │  B  │  G  │  S  │  Z  │
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │     #     │             │     #     │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │  A  │  O  │   │MT_TG│   │  E  │  U  │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_GEMINI] = LAYOUT(
        STN_N1, STN_S1,  STN_TL,  STN_PL,  STN_HL,  STN_ST1, STN_ST3, STN_FR,  STN_PR,  STN_LR,  STN_TR,  STN_DR,
        STN_N2, STN_S2,  STN_KL,  STN_WL,  STN_RL,  STN_ST2, STN_ST4, STN_RR,  STN_BR,  STN_GR,  STN_SR,  STN_ZR,
                                           STN_N3,  MT_TGL,  STN_N4,
                                           STN_A,   STN_O,   STN_E,   STN_U
    ),
    // NUMBER
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  -  │  1  │  2  │  3  │ 00  │             │ PGU │ HOM │  ↑  │ END │ CAP │ JIS │
    // ├─────┼─────┼──4──┼──5──┼──6──┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ ESC │  .  │  7  │  8  │  9  │  0  │             │ PGD │  ←  │  ↓  │  →  │ SFT │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ WIN │ ALT │   │MT_TG│   │INT5 │INT4 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_NUMBER] = LAYOUT(
        KC_GRV, KC_MINS, KC_1,  KC_2,  KC_3,  KC_DZ,   KC_PGUP, KC_HOME, KC_UP,   KC_END,   KC_CAPS, TG_JIS,
        MT_ESC, KC_DOT,  KC_7,  KC_8,  KC_9,  KC_0,    KC_PGDN, KC_LEFT, KC_DOWN, KC_RIGHT, KC_LSFT, MO_FUN,
                                              MT_SPC,  KC_TRNS, MT_ENT,
                                              KC_LALT, KC_LCTL, KC_INT5, KC_INT4
    ),
    // FUNCTION
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │ F1  │ F2  │ F3  │ F4  │ F5  │ F11 │             │ PGU │ HOM │  ↑  │ END │ CAP │ JIS │
    // ├─────┼─────┼─────┼─────┼─────┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ ESC │ F6  │ F7  │ F8  │ F9  │ F10 │             │ PGD │  ←  │  ↓  │  →  │ ESC │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ WIN │ ALT │   │MT_TG│   │ F12 │ F13 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_FUNCTION] = LAYOUT(
        KC_F1,   KC_F2,  KC_F3,  KC_F4, KC_F5,   KC_F11,  KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
        KC_TRNS, KC_F6,  KC_F7,  KC_F8, KC_F9,   KC_F10,  KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
                                        KC_TRNS, KC_TRNS, KC_TRNS,
                                        KC_TRNS, KC_TRNS, KC_F12, KC_F13
    ),
};
// ..................................................................... Keymaps

// Combos
const uint16_t PROGMEM qwerty_combo1[] = {KC_Q, KC_Z, COMBO_END};
const uint16_t PROGMEM qwerty_combo2[] = {KC_W, KC_X, COMBO_END};
const uint16_t PROGMEM qwerty_combo3[] = {KC_E, KC_C, COMBO_END};
const uint16_t PROGMEM qwerty_combo4[] = {KC_R, KC_V, COMBO_END};
const uint16_t PROGMEM qwerty_combo5[] = {KC_T, KC_B, COMBO_END};
const uint16_t PROGMEM qwerty_combo6[] = {KC_V, KC_B, COMBO_END};
const uint16_t PROGMEM qwerty_combo7[] = {KC_Y, KC_N, COMBO_END};
const uint16_t PROGMEM qwerty_combo8[] = {KC_U, KC_M, COMBO_END};
const uint16_t PROGMEM qwerty_combo9[] = {KC_I, KC_COMM, COMBO_END};
const uint16_t PROGMEM qwerty_combo10[] = {KC_O, KC_DOT, COMBO_END};
const uint16_t PROGMEM qwerty_combo11[] = {KC_P, KC_SLSH, COMBO_END};
const uint16_t PROGMEM qwerty_combo12[] = {KC_MINS, KC_BSLS, COMBO_END};
const uint16_t PROGMEM qwerty_combo13[] = {KC_N, KC_M, COMBO_END};
const uint16_t PROGMEM qwerty_combo14[] = {KC_Y, KC_U, COMBO_END};
const uint16_t PROGMEM qwerty_combo15[] = {KC_LBRC, KC_RBRC, COMBO_END};
const uint16_t PROGMEM qwerty_combo16[] = {KC_PGDN, KC_LEFT, COMBO_END};
const uint16_t PROGMEM qwerty_combo17[] = {KC_PGUP, KC_HOME, COMBO_END};
const uint16_t PROGMEM qwerty_combo18[] = {KC_9, KC_0, COMBO_END};
const uint16_t PROGMEM qwerty_combo19[] = {KC_1, KC_7, COMBO_END};
const uint16_t PROGMEM qwerty_combo20[] = {KC_2, KC_8, COMBO_END};
const uint16_t PROGMEM qwerty_combo21[] = {KC_3, KC_9, COMBO_END};


combo_t key_combos[] = {
    COMBO(qwerty_combo1, KC_A),
    COMBO(qwerty_combo2, KC_S),
    COMBO(qwerty_combo3, KC_D),
    COMBO(qwerty_combo4, KC_F),
    COMBO(qwerty_combo5, KC_G),
    COMBO(qwerty_combo6, KC_TAB),
    COMBO(qwerty_combo7, KC_H),
    COMBO(qwerty_combo8, KC_J),
    COMBO(qwerty_combo9, KC_K),
    COMBO(qwerty_combo10, KC_L),
    COMBO(qwerty_combo11, KC_SCLN),
    COMBO(qwerty_combo12, KC_QUOT),
    COMBO(qwerty_combo13, KC_BSPC),
    COMBO(qwerty_combo14, KC_DEL),
    COMBO(qwerty_combo15, KC_EQL),
    COMBO(qwerty_combo16, KC_BSPC),
    COMBO(qwerty_combo17, KC_DEL),
    COMBO(qwerty_combo18, KC_TAB),
    COMBO(qwerty_combo19, KC_4),
    COMBO(qwerty_combo20, KC_5),
    COMBO(qwerty_combo21, KC_6),
};

// Initialize the steno protocol
void eeconfig_init_user(void) {
    steno_set_mode(STENO_MODE_GEMINI);  // or STENO_MODE_BOLT
}
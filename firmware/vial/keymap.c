// SPDX-License-Identifier: GPL-3.0-or-later
#ifndef MJI_EN_PROFILE
#    define MJI_EN_PROFILE 0
#endif
#ifndef MJI_WEB_EN_DEFAULT
#    define MJI_WEB_EN_DEFAULT 0
#endif
#ifndef MJI_WEB_JP_DEFAULT
#    define MJI_WEB_JP_DEFAULT 0
#endif
#define MJI_DEFAULT_MEJIRO (!MJI_EN_PROFILE)
#define MJI_DEFAULT_JIS false
#define MJI_ENGLISH_LAYOUT mji_layout_qwerty
#define MJI_JAPANESE_LAYOUT mji_layout_qwerty
#include "qmk/keymap_impl.h"

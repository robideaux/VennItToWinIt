// User settings, persisted under one localStorage key. theme.js reads the same key at boot
// (for the theme only), so the key and the `theme` field are shared with it.
export const SETTINGS_KEY = 'vennit_settings'

// Vibration defaults OFF everywhere. On a device that supports it the toggle is available
// but starts off, so nobody's phone buzzes before they have chosen it.
export const SETTING_DEFAULTS = { theme: 'system', vibration: false }

// Never throws: Safari private browsing can throw just from touching localStorage, and a
// settings read must not be able to break a game.
export function loadSettings(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) || '{}')
    return { ...SETTING_DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch {
    return { ...SETTING_DEFAULTS }
  }
}

export function saveSettings(settings, storage = globalThis.localStorage) {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* losing a preference is better than throwing mid-game */
  }
}

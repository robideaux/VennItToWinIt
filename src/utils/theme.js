// Theme application, shared by boot and the Settings screen.
//
// This used to live inside SettingsScreen, which meant it only ran while that screen was
// mounted — so a saved Light or Dark preference was ignored on startup and the app fell
// back to the OS setting until you happened to open Settings. Applying it at boot is the
// point of having it in a module.

const STORAGE_KEY = 'vennit_settings'

// Matched to --color-surface, not --color-bg: the browser's chrome sits directly above
// the app's header, so blending with the header is what makes the bar stop announcing
// itself. Kept in sync with global.css by hand — there is no way to read a CSS custom
// property before first paint.
const SURFACE = { light: '#ffffff', dark: '#1a1a1a' }

export function readTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : 'system'
  } catch {
    return 'system'
  }
}

export function prefersDark() {
  try {
    return matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

// 'system' resolves against the OS; everything else is itself.
export const resolveTheme = theme =>
  theme === 'light' || theme === 'dark' ? theme : prefersDark() ? 'dark' : 'light'

// One managed <meta>, replacing the static pair in index.html.
//
// Those two carry a `media` attribute so the very first paint is right before any script
// runs, which a single JS-managed tag cannot do. But a manual Light/Dark override is
// invisible to a media query, so once JS is up it takes over — dropping the pair rather
// than layering on top of it, because which of several theme-color tags wins depends on
// document order and is not worth relying on.
function setThemeColor(color) {
  if (typeof document === 'undefined') return
  let meta = document.head.querySelector('meta[name="theme-color"][data-managed]')
  if (!meta) {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove())
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.dataset.managed = 'true'
    document.head.appendChild(meta)
  }
  meta.content = color
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme === 'system' ? '' : theme
  setThemeColor(SURFACE[resolveTheme(theme)])
}

// Keeps the chrome in step when the OS flips dark mode while the app is open — but only
// while the preference is 'system', since an explicit choice should not follow the OS.
export function watchSystemTheme() {
  try {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (readTheme() === 'system') applyTheme('system') }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  } catch {
    return () => {}
  }
}

import { colorModeOverrideStorageKey } from '../config/appConfig'

export function getAutomaticNightMode() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return true
  }

  const currentHour = new Date().getHours()
  return currentHour < 6 || currentHour >= 17
}

export function getSavedColorModeOverride() {
  try {
    const savedMode = localStorage.getItem(colorModeOverrideStorageKey)
    return savedMode === 'day' || savedMode === 'night' ? savedMode : 'auto'
  } catch {
    return 'auto'
  }
}

export function getNightModeFromPreference(colorModePreference) {
  if (colorModePreference === 'night') return true
  if (colorModePreference === 'day') return false
  return getAutomaticNightMode()
}

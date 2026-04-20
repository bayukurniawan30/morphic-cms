/**
 * Project Versioning Utility
 *
 * To update the version, change the APP_VERSION constant below.
 * This can be used in the PDF footer, Dashboard, or any other part of the UI.
 */

export const APP_VERSION = '1.1.0'
export const APP_NAME = 'Morphic CMS'

/**
 * Returns the full version string with optional prefix.
 * @param prefix - String to prepend to the version (default: 'v')
 * @returns Formatted version string (e.g., 'v1.0.0-fd2a0')
 */
export const getAppVersion = (prefix = 'v') => {
  const hash = import.meta.env.VITE_GIT_HASH
  const hashSuffix = hash && hash !== 'unknown' ? `-${hash}` : ''
  return `${prefix}${APP_VERSION}${hashSuffix}`
}

/**
 * Returns the full app name with version.
 * @returns Formatted string (e.g., 'Morphic CMS v0.1.0-fd2a0')
 */
export const getFullAppName = () => {
  return `${APP_NAME} ${getAppVersion()}`
}

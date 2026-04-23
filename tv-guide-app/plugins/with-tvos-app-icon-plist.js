/**
 * tvOS: ensure Info.plist icon keys match what App Store Connect expects.
 *
 * Problem: CFBundleIcons.CFBundlePrimaryIcon was ending up as a string
 * ("App Icon - Small") instead of a dictionary, and CFBundleIconName was missing.
 * ASC then fails with 90713 / 90039.
 *
 * We set CFBundleIconName to the primary brand-asset name from
 * @react-native-tvos/config-tv (see withTVAppleIconImages.js): "App Icon - Small".
 * and remove the broken CFBundleIcons entry so the asset catalog supplies icons.
 */
const { withInfoPlist } = require('expo/config-plugins');

const TV_PRIMARY_ICON_NAME = 'App Icon - Small';

function withTvOSAppIconPlist(config) {
  return withInfoPlist(config, (config) => {
    if (process.env.EXPO_TV !== '1') {
      return config;
    }
    const plist = config.modResults;
    delete plist.CFBundleIcons;
    plist.CFBundleIconName = TV_PRIMARY_ICON_NAME;
    return config;
  });
}

module.exports = withTvOSAppIconPlist;

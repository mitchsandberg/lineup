/**
 * tvOS: ensure Info.plist icon keys match what App Store Connect expects.
 *
 * Problem: CFBundleIcons.CFBundlePrimaryIcon can end up as a string
 * ("App Icon - Small") instead of a dictionary. Prebuild withInfoPlist can fix the
 * source plist, but the Xcode / asset catalog pass merges keys back into the
 * built app (90039 / 90713).
 *
 * We set CFBundleIconName to the primary brand-asset name from
 * @react-native-tvos/config-tv: "App Icon - Small", delete CFBundleIcons in the
 * template plist, and add a Run Script that strips CFBundleIcons from the
 * built .app Info.plist (after actool) so the fix survives archive.
 */
const { withInfoPlist, withXcodeProject } = require('expo/config-plugins');

const TV_PRIMARY_ICON_NAME = 'App Icon - Small';
const XCODE_BUILD_PHASE_NAME = '[lineup] Fix tvOS App Store Info.plist (CFBundleIcons)';

function isAppleTVPlist(plist) {
  const platforms = plist.CFBundleSupportedPlatforms;
  if (Array.isArray(platforms) && platforms.includes('AppleTVOS')) {
    return true;
  }
  const fam = plist.UIDeviceFamily;
  if (Array.isArray(fam) && fam.includes(3)) {
    return true;
  }
  if (plist.TVTopShelfImage != null) {
    return true;
  }
  return false;
}

/**
 * We observed a bad merge where CFBundlePrimaryIcon is a *string*:
 *   CFBundleIcons: { CFBundlePrimaryIcon: "App Icon - Small" }
 * App Store Connect rejects with 90039; CFBundleIconName is also required (90713).
 */
function hasBrokenAppIconPlist(plist) {
  const ci = plist.CFBundleIcons;
  if (ci == null) {
    return true;
  }
  if (typeof ci === 'string') {
    return true;
  }
  if (typeof ci === 'object' && typeof ci.CFBundlePrimaryIcon === 'string') {
    return true;
  }
  return false;
}

function hasTvosPlistFixBuildPhase(project) {
  const { firstTarget } = project.getFirstTarget();
  if (!firstTarget || !Array.isArray(firstTarget.buildPhases)) {
    return false;
  }
  return firstTarget.buildPhases.some(
    (phase) => phase.comment && String(phase.comment).includes('[lineup] Fix tvOS App Store Info.plist'),
  );
}

/**
 * @param {import('xcode').XcodeProject} project
 */
function addFixPlistBuildPhase(project) {
  if (hasTvosPlistFixBuildPhase(project)) {
    return;
  }
  const { uuid: targetUuid } = project.getFirstTarget();
  if (!targetUuid) {
    return;
  }
  // Must match the catalog name in @react-native-tvos/config-tv (withTVAppleIconImages).
  const iconName = TV_PRIMARY_ICON_NAME;
  const shellScript = `SDK_BASENAME="\${SDKROOT##*/}"
if [ "\$SDK_BASENAME" != "appletvos" ] && [ "\$SDK_BASENAME" != "AppleTVOS" ]; then
  exit 0
fi
PLIST=""
if [ -n "\${CODESIGNING_FOLDER_PATH:-}" ] && [ -f "\${CODESIGNING_FOLDER_PATH}/Info.plist" ]; then
  PLIST="\${CODESIGNING_FOLDER_PATH}/Info.plist"
elif [ -f "\${BUILT_PRODUCTS_DIR}/\${WRAPPER_NAME}/Info.plist" ]; then
  PLIST="\${BUILT_PRODUCTS_DIR}/\${WRAPPER_NAME}/Info.plist"
elif [ -f "\${TARGET_BUILD_DIR}/\${WRAPPER_NAME}/Info.plist" ]; then
  PLIST="\${TARGET_BUILD_DIR}/\${WRAPPER_NAME}/Info.plist"
elif [ -n "\${INFOPLIST_PATH:-}" ] && [ -f "\${TARGET_BUILD_DIR}/\${INFOPLIST_PATH}" ]; then
  PLIST="\${TARGET_BUILD_DIR}/\${INFOPLIST_PATH}"
fi
if [ -z "\$PLIST" ] || [ ! -f "\$PLIST" ]; then
  exit 0
fi
if /usr/libexec/PlistBuddy -c "Print :CFBundleIcons" "\$PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Delete :CFBundleIcons" "\$PLIST" 2>/dev/null || true
fi
if ! /usr/libexec/PlistBuddy -c "Print :CFBundleIconName" "\$PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleIconName string ${iconName}" "\$PLIST" 2>/dev/null || true
fi
`;

  const { buildPhase } = project.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    XCODE_BUILD_PHASE_NAME,
    targetUuid,
    {
      shellPath: '/bin/sh',
      shellScript,
    },
  );
  // Xcode 14+ may skip run scripts with no declared inputs/outputs; match Expo’s RN bundling phase.
  if (buildPhase) {
    buildPhase.alwaysOutOfDate = 1;
    buildPhase.showEnvVarsInLog = 0;
  }
}

function withTvOSAppIconPlist(config) {
  config = withInfoPlist(config, (config) => {
    const plist = config.modResults;
    const isTv = process.env.EXPO_TV === '1' || isAppleTVPlist(plist);
    if (!isTv) {
      return config;
    }
    if (!hasBrokenAppIconPlist(plist) && typeof plist.CFBundleIconName === 'string' && plist.CFBundleIconName.length > 0) {
      return config;
    }
    delete plist.CFBundleIcons;
    plist.CFBundleIconName = TV_PRIMARY_ICON_NAME;
    return config;
  });

  return withXcodeProject(config, (config) => {
    // Only tvOS EAS / local prebuilds set EXPO_TV=1 in eas.json or the shell.
    if (process.env.EXPO_TV !== '1') {
      return config;
    }
    addFixPlistBuildPhase(config.modResults);
    return config;
  });
}

module.exports = withTvOSAppIconPlist;

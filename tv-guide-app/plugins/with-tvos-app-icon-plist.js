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
 *
 * CocoaPods appends shell phases (e.g. [CP] Embed Pods Frameworks) *after* prebuild
 * rewrites the xcodeproj, so that script can run *after* our PlistBuddy fix. We
 * inject a Podfile post_install step that reorders the fix phase to the end of
 * the app target (after all [CP] phases) and save the project, so the fix runs
 * last before signing.
 */
const { withInfoPlist, withXcodeProject, withPodfile } = require('expo/config-plugins');

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

const PODS_REORDER_MARK = '    # [lineup] Move tvOS plist fix after CocoaPods';

/**
 * After `pod install`, place our run script *after* all CocoaPods-injected build phases
 * (see user log: [lineup]… ran, then [CP] Embed Pods Frameworks, then signing).
 * @param {string} podfileContents
 * @returns {string}
 */
function withTvOSPodfilePlistFixReorder(podfileContents) {
  if (typeof podfileContents !== 'string' || podfileContents.includes(PODS_REORDER_MARK)) {
    return podfileContents;
  }
  const needle = `    :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;
  if (!podfileContents.includes(needle)) {
    return podfileContents;
  }
  const postInstall = `${PODS_REORDER_MARK}
    begin
      require 'xcodeproj'
      app_project = Dir[File.join(__dir__, '*.xcodeproj')].first
      if app_project
        p = Xcodeproj::Project.open(app_project)
        changed = false
        p.targets.each do |target|
          next unless target.product_type == 'com.apple.product-type.application'
          fix = target.build_phases.find { |bp| bp.respond_to?(:name) && bp.name.to_s.include?('Fix tvOS App Store Info.plist') }
          if fix
            target.build_phases.delete(fix)
            target.build_phases << fix
            changed = true
          end
        end
        p.save if changed
      end
    rescue => e
      Pod::UI.warn('Lineup tvOS: reorder plist fix phase: ' + e.to_s)
    end
`;
  return podfileContents.replace(needle, `${needle}\n${postInstall}`);
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

  config = withXcodeProject(config, (config) => {
    // Only tvOS EAS / local prebuilds set EXPO_TV=1 in eas.json or the shell.
    if (process.env.EXPO_TV !== '1') {
      return config;
    }
    addFixPlistBuildPhase(config.modResults);
    return config;
  });

  return withPodfile(config, (config) => {
    if (process.env.EXPO_TV !== '1' || !config.modResults || typeof config.modResults.contents !== 'string') {
      return config;
    }
    config.modResults.contents = withTvOSPodfilePlistFixReorder(config.modResults.contents);
    return config;
  });
}

module.exports = withTvOSAppIconPlist;

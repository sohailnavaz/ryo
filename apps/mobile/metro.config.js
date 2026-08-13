const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support: watch the workspace root
config.watchFolders = [workspaceRoot];

// Let Metro resolve modules from the app + workspace root (hoisted deps)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

// `@bnb/ui` ships subpath exports (./nav, ./Map, ./Calendar, ./CommandPalette) via the
// package.json "exports" map with react-native/default conditions. Metro ignores that
// map unless package-exports is enabled — without this, `@bnb/ui/nav` fails to resolve
// and the whole app fails to bundle. `react-native` must win over `default` so the
// native platform split is picked.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = withNativeWind(config, { input: './global.css' });

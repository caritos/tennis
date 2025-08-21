const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    // Aggressive minification for production
    keep_fnames: false,
    mangle: {
      toplevel: true,
    },
    compress: {
      drop_console: true, // Remove console logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
  },
};

// Optimize module resolution
config.resolver = {
  ...config.resolver,
  // Cache module resolution for faster rebuilds
  hasteImplModulePath: null,
  // Improve tree shaking
  unstable_enablePackageExports: true,
};

// Enable RAM bundles for faster startup
config.serializer = {
  ...config.serializer,
  processModuleFilter: (module) => {
    // Exclude test files from production bundle
    return !module.path.includes('__tests__') && 
           !module.path.includes('.test.') &&
           !module.path.includes('.spec.');
  },
};

module.exports = config;
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
];

config.resolver.resolverMainFields = ["react-native", "browser", "main"];

config.resolver.extraNodeModules = {
  "@microsoft/signalr": path.resolve(__dirname, "node_modules/@microsoft/signalr"),
};

// Disable Cross-Origin Isolation headers for Firebase Auth Popups on Web
if (config.server) {
  const originalEnhanceMiddleware = config.server.enhanceMiddleware;
  config.server.enhanceMiddleware = (middleware, server) => {
    const defaultMiddleware = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(middleware, server)
      : middleware;

    return (req, res, next) => {
      // Remove the restrictive headers causing Firebase to crash!
      res.removeHeader("Cross-Origin-Opener-Policy");
      res.removeHeader("Cross-Origin-Embedder-Policy");
      // Fallback: manually overwrite them to be safe if they re-generate
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
      
      return defaultMiddleware(req, res, next);
    };
  };
}

module.exports = config;

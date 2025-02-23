module.exports = {
    resolvePluginsRelativeTo: __dirname,
    plugins: ["react-hooks"],
    extends: ["react-app", "react-app/jest"],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  };
  
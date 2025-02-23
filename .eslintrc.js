module.exports = {
    plugins: ["react-hooks"],
    extends: ["react-app", "react-app/jest"],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  };
  
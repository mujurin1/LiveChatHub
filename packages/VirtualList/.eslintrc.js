const path = require("path");

module.exports = {
  root: false,
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [path.resolve(__dirname, "./tsconfig.json")],
      }
    }
  ]
};

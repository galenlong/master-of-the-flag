module.exports = {
  env: {
    "node": true,
    "es6": true,
    "jest": true,
  },
  extends: [
    // airbnb basic javascript rules
    "airbnb-base",
    // basic jest rules
    "plugin:jest/recommended",
    "plugin:@typescript-eslint/recommended",
    // runs prettier as an eslint plugin
    // so we can format and lint code in one step
    "plugin:prettier/recommended",
    // eslint-config-prettier
    // disables prettier rules that conflict with eslint
    "prettier/@typescript-eslint",
  ],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".svg", ".css"]
      }
    },
    react: {
      version: "detect"
    }
  },
  parserOptions: {
    ecmaFeatures: {jsx: true}
  },
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/explicit-function-return-type": ["warn", 
      {"allowExpressions": true}
    ],
  }
}
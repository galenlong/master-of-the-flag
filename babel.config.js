
// https://jestjs.io/docs/en/getting-started#using-babel

module.exports = api => {
  const isTest = api.env('test');

  const presets = ["@babel/preset-react", "@babel/preset-env"];
  const plugins = ["@babel/plugin-proposal-class-properties"];

  // because otherwise, jest will remove all asserts
  // so certain tests that expect assertion errors will fail
  if (!isTest) {
  	plugins.push("babel-plugin-unassert");
  }

  return {presets, plugins};
};

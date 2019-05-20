
// https://jestjs.io/docs/en/getting-started#using-babel

module.exports = api => {
  const isTest = api.env('test');

  // https://devblogs.microsoft.com/typescript/typescript-and-babel-7/
  const presets = [
  	"@babel/preset-react",
  	"@babel/preset-env",
  	"@babel/preset-typescript",
  ];
  const plugins = ["@babel/plugin-proposal-class-properties"];

  // this is only available as a command line flag for some reason
  // so every time we call babel-cli, we need to specify this
  // const extensions = [".ts", ".js"];

  if (!isTest) {
  	// some jest tests check for functions throwing errors via asserts
  	// if asserts are compiled out, tests will fail
  	plugins.push("babel-plugin-unassert");
  }

  return {presets, plugins};
};

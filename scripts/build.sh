
rm dist/*.js
rm dist/public/bundle.js

# compile everything needed for server code to run
# does server-side rendering, so needs react components compiled
# to make babel include TS files in compilation, pass --extensions flag
# not available as configuration option, so has to be command line arg
# https://gist.github.com/rstacruz/648cb4dc68a76c761dc9e989832d9a50
npx babel src/ --out-dir dist/ \
	--ignore "src/*.test.ts,src/*.test.js,src/browser.js" \
	--extensions ".ts,.js"

# browser.js is bundled so it can be served to clients for client-side game running
# could theoretically have previous babel command compile browser.js
# and instead have browserify bundle dist/browser.js with its dependencies
# (thus removing the need for babelify)
# but I'm keeping them separate for now so I can enable different features
# for the bundled client code and the server-side code (e.g. source maps)

# --extension needed for browserify to resolve paths for imports of TS files

# additionally, all imports of  TS files should exclude extension from file path
# e.g. import * as Foo from "./foo" (instead of "./foo.ts")
# because src/foo.ts will become dist/foo.js
# and we need the import paths to resolve for both pre- and post-compiled code

npx browserify src/browser.js -o dist/public/bundle.js \
	--standalone bundle \
	--debug true \
	--extension=.js --extension=.ts \
	-t [ babelify --extensions ".ts,.js" ]

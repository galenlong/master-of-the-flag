
# to make babel work with typescript, must pass --extensions flag
# https://gist.github.com/rstacruz/648cb4dc68a76c761dc9e989832d9a50
# not available as configuration option, so has to be command line arg

npx babel src/ --out-dir dist/ \
	--ignore src/browser.js,src/*.test.js \
	--extensions '.ts'

npx browserify src/browser.js -o dist/public/bundle.js \
	--standalone bundle \
	--debug true \
	-t [ babelify ]


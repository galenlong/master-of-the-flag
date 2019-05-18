
npx babel src/ --out-dir dist/ --ignore src/browser.js,src/tests.js

npx browserify src/browser.js -o dist/public/bundle.js \
	--standalone bundle \
	-t [ babelify ]


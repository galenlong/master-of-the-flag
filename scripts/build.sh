
npx babel src/ --out-dir dist/ --ignore src/browser.jsx,src/tests.js

npx browserify src/browser.jsx -o dist/public/bundle.js \
	--standalone bundle \
	-t [ babelify ]


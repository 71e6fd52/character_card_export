build: dist/main.js dist/style.css dist/index.html dist/xlsx.mjs

release: release/main.js release/style.css release/xlsx.mjs release/index.html
	ghp-import -c coccard.yahvk.moe -p release

clean:
	rm -rf dist release bower_components xlsx.d.mts xlsx.mjs


dist/index.html: index.html
	cp index.html dist/index.html

dist/xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	cp bower_components/js-xlsx/xlsx.mjs dist/xlsx.mjs

dist/main.js: main.ts xlsx.mjs xlsx.d.mts
	tsc

dist/style.css: style.sass
	sass style.sass dist/style.css


release/index.html: index.html
	cp index.html release/index.html

release/xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	cp bower_components/js-xlsx/xlsx.mjs release/xlsx.mjs

release/main.js: dist/main.js
	terser dist/main.js >release/main.js

release/style.css: style.sass
	sass style.sass release/style.css --style compressed --no-source-map

xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	ln -sr bower_components/js-xlsx/xlsx.mjs xlsx.mjs

xlsx.d.mts: bower_components/js-xlsx/types/index.d.ts
	ln -sr bower_components/js-xlsx/types/index.d.ts xlsx.d.mts

bower_components/js-xlsx/xlsx.mjs bower_components/js-xlsx/types/index.d.ts:
	bower install js-xlsx

.PHONY: build release

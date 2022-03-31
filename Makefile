build: dist/main.js dist/style.css dist/index.html dist/xlsx.mjs

release: build
	ghp-import -c coccard.yahvk.moe -p dist

clean:
	rm -r dist bower_components xlsx.d.mts xlsx.mjs

dist/main.js: main.ts xlsx.mjs xlsx.d.mts
	tsc

dist/style.css: style.sass
	sass style.sass dist/style.css

dist/index.html: index.html
	cp index.html dist/index.html

dist/xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	cp bower_components/js-xlsx/xlsx.mjs dist/xlsx.mjs

xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	ln -sr bower_components/js-xlsx/xlsx.mjs xlsx.mjs

xlsx.d.mts: bower_components/js-xlsx/types/index.d.ts
	ln -sr bower_components/js-xlsx/types/index.d.ts xlsx.d.mts

bower_components/js-xlsx/xlsx.mjs bower_components/js-xlsx/types/index.d.ts:
	bower install js-xlsx

.PHONY: build release

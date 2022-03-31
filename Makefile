build: main.js style.css

main.js: main.ts xlsx.mjs xlsx.d.mts
	tsc

style.css: style.sass
	sass style.sass style.css

xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	ln -sr bower_components/js-xlsx/xlsx.mjs xlsx.mjs

xlsx.d.mts: bower_components/js-xlsx/types/index.d.ts
	ln -sr bower_components/js-xlsx/types/index.d.ts xlsx.d.mts

bower_components/js-xlsx/xlsx.mjs bower_components/js-xlsx/types/index.d.ts:
	bower install js-xlsx

.PHONY: build

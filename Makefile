build: dist/main.js dist/style.css dist/index.html dist/xlsx.mjs dist/gh-fork-ribbon.css

release: release/main.js release/style.css release/xlsx.mjs release/index.html release/gh-fork-ribbon.css
	ghp-import -c coccard.yahvk.moe -p release

clean:
	rm -rf dist release bower_components xlsx.d.mts xlsx.mjs


watch:
	while true; do \
		make $(WATCHMAKE); \
		inotifywait -qre close_write .; \
		sleep 1s; \
	done

dist/index.html: index.html
	cp -T index.html dist/index.html

dist/xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	cp -T bower_components/js-xlsx/xlsx.mjs dist/xlsx.mjs

dist/main.js: main.ts xlsx.mjs xlsx.d.mts
	tsc

dist/style.css: style.sass
	sass style.sass dist/style.css

dist/gh-fork-ribbon.css:
	cp -T bower_components/github-fork-ribbon-css/gh-fork-ribbon.css dist/gh-fork-ribbon.css


release/index.html: index.html
	cp -T index.html release/index.html

release/xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	cp -T bower_components/js-xlsx/xlsx.mjs release/xlsx.mjs

release/main.js: dist/main.js
	terser dist/main.js >release/main.js

release/style.css: style.sass
	sass style.sass release/style.css --style compressed --no-source-map

release/gh-fork-ribbon.css:
	sass bower_components/github-fork-ribbon-css/gh-fork-ribbon.css release/gh-fork-ribbon.css --style compressed


xlsx.mjs: bower_components/js-xlsx/xlsx.mjs
	ln -sr bower_components/js-xlsx/xlsx.mjs xlsx.mjs

xlsx.d.mts: bower_components/js-xlsx/types/index.d.ts
	ln -sr bower_components/js-xlsx/types/index.d.ts xlsx.d.mts

bower_components/js-xlsx/xlsx.mjs bower_components/js-xlsx/types/index.d.ts:
	bower install js-xlsx

bower_components/github-fork-ribbon-css/gh-fork-ribbon.css:
	bower install github-fork-ribbon-css

.PHONY: build release watch

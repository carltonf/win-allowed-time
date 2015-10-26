VENDOR_MODULES := d3 jquery
NODE_INTERNAL_MODULES := events
EXT_MODULES := ${VENDOR_MODULES} ${NODE_INTERNAL_MODULES}
PORT ?= 3000
APP_ENTRY := src/main.js
APP_SRCS := $(wildcard src/*.js)
TEST_SCRIPT := node_modules/node-skewer/public/skewer.js
ifneq ($(MAKECMDGOALS),dist)
APP_SRCS := ${APP_SRCS} ${TEST_SCRIPT}
endif
APP_STYLE_ENTRY := src/main.scss
APP_STYLE_SRCS := $(wildcard src/*.css src/*.scss)

.DELETE_ON_ERROR:

DIR_GUARD = @mkdir -pv $(@D)

CSS_BUNDLE_CMD := sassc --sourcemap
JS_BUNDLE_CMD := browserify --debug

# * Build

bundle: bundle-vendor bundle-app

bundle-vendor: bundle/vendor.js
bundle/vendor.js: ${VENDOR_MODULES:%=node_modules/%}
	@echo "** Bundling all vendor modules..."
	${DIR_GUARD}
	@${JS_BUNDLE_CMD} ${EXT_MODULES:%=-r %} -o $@

bundle-app: bundle/app.js bundle/app.css
bundle/app.js: ${APP_SRCS}
	@echo "** Bundling all app scripts..."
	${DIR_GUARD}
	@${JS_BUNDLE_CMD} ${APP_ENTRY} ${EXT_MODULES:%=-x %} -o $@

bundle/app.css: ${APP_STYLE_SRCS}
	@echo "** Bundling all app styles..."
	@${DIR_GUARD}
	@${CSS_BUNDLE_CMD} ${APP_STYLE_ENTRY} $@

# * Test
test: bundle
	@echo ${APP_SRCS}
	@npm test

# * Watch
WATCH_BUNDLE_ROOT = $(shell pwd)

# TODO broserify may change the atime of the source file (if it's changed since
# last browerifying) so watchman may run twice the command (which leads to some
# failure log....).
#
# NOTE: pass all necessary env to watchman as it would not copy current env.
define WATCH_BUNDLE_TRIGGER
["trigger", "${WATCH_BUNDLE_ROOT}", {
    "name": "make reload",
    "expression": ["anyof",
      ["match", "*.html"],
      ["match", "src/**/*.js", "wholename"],
      ["match", "src/**/*.*css", "wholename"]
    ],
    "command": [ "make", "reload", "PORT=${PORT}" ],
    "append_files": false
}]
endef
export WATCH_BUNDLE_TRIGGER
# TODO migrate watch to watch-project
# TODO currently I only know to visit the log file for log, a little inconvenient.
watch:
	@watchman watch $(shell pwd)
	@echo "$${WATCH_BUNDLE_TRIGGER}" | watchman -j

unwatch:
	watchman watch-del ${WATCH_BUNDLE_ROOT}

SSE_URL := http://localhost:${PORT}/node-skewer
reload: bundle
	@echo "** Reloading..."
	@curl --silent --show-error "${SSE_URL}/notify?cmd=reload"

# * Distribution
dist:
	@echo "Build distribution package: currently do NOTHING!"

# * Clean
RM := rm -rfv
clean:
	@${RM} bundle/*

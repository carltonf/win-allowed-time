VENDOR_MODULES :=
PORT ?= 3000
APP_SRCS := src/*.js
TEST_SCRIPT := node_modules/node-skewer/public/skewer.js
ifneq ($(MAKECMDGOALS),dist)
APP_SRCS := ${APP_SRCS} ${TEST_SCRIPT}
endif

# * Build
DIR_GUARD = @mkdir -pv $(@D)

BUNDLE_CMD := browserify --debug
bundle: bundle-vendor bundle-app

bundle-vendor: bundle/vendor.js
bundle/vendor.js: ${VENDOR_MODULES:%=node_modules/%}
	@echo "** Bundling all vendor modules..."
	${DIR_GUARD}
	@${BUNDLE_CMD} ${VENDOR_MODULES:%=-r %} -o $@

# TODO optionally we have app modules?

bundle-app: bundle/app.js
bundle/app.js: ${APP_SRCS}
	@echo "** Bundling all app scripts..."
	${DIR_GUARD}
	@${BUNDLE_CMD} $^ ${VENDOR_MODULES:%=-x %} -o $@
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
      ["match", "src/**/*.js", "wholename"]
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

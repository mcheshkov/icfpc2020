#!/bin/sh

node ts_eval/build/bot_main.js "$@" || echo "run error code: $?"
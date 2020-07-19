#!/bin/sh

node ts_eval/build/bot.js "$@" || echo "run error code: $?"
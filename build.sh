#!/bin/sh

cd app
CI=true cargo build --release --offline --color=never

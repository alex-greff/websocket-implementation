#!/bin/bash

rm -rf ./submission

mkdir submission

cp ./README.md ./submission/README.md
cp ./report.pdf ./submission/report.pdf
cp ./.gitignore ./submission/.gitignore

# Source for copying with file exclusion:
# https://stackoverflow.com/a/14789400

rsync -ax websocket-client submission --exclude node_modules
rsync -ax websocket-server submission --exclude __pycache__

rsync -ax testing-app submission \
  --exclude client/node_modules \
  --exclude client/.webpack \
  --exclude server-reference/node_modules

#!/usr/bin/env bash
# Cloudflare Pages runs `npm install` because package.json exists; the live site does not
# need node_modules (HTML/JS/data only). Remove deps so Workers asset limits are not hit.
set -euo pipefail
rm -rf node_modules
echo "Removed node_modules; static assets only for deploy."

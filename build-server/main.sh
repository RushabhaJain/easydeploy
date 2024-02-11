#!/bin/bash

export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"
git clone "$GIT_REPOSITORY__URL" ./output
exec node script.js
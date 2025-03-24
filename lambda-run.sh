#!/bin/sh

# read in .env
set -a
source .env
set +a

export DISABLE_PUSH_QUEUE=true
# export NODE_ENV=production

node --inspect lambda-wrapper

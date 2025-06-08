#!/bin/bash

cd "$(dirname "$0")"

echo "Building distribution..."
pnpm install
pnpm build

echo "Cleaning up mode_modules - removing non-production ones..."
pnpm install --prod --node-linker=hoisted
pnpm prune --production

echo "Creating upload zipfile..."
rm function.zip 
zip -r function.zip \
    package.json \
    keyring.json \
    index.js \
    dist/* \
    www/* \
    www/.well-known/* \
    node_modules/* --exclude 'node_modules/@aws-sdk/*'

echo "Deploying to Lambda..."
aws lambda update-function-code --function-name agentic-profile-presence-service --zip-file fileb://function.zip --profile agentic

echo "Done!"
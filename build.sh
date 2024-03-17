#!/bin/bash
npx tsc
cd dist
zip -r ../my-lambda-function.zip .
cd ..
npm install --only=prod
zip -ur my-lambda-function.zip node_modules
#!/usr/bin/env bash

cp target/idl/mono_program.json sdk/idl/mono_program.json &&
cp target/types/mono_program.ts sdk/types/mono_program.ts

echo "✨ Updated contract's idl to sdk"

yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
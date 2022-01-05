#!/usr/bin/env node

const {MATCHER} = require('../dist/hlint');
process.stdout.write(JSON.stringify(MATCHER.definition, null, 2) + '\n');

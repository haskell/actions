#!/usr/bin/env node

const path = require('path');
const {MATCHER, MATCHER_DEF_PATH} = require('../dist/hlint');
const {main, writeFile} = require('./_util');

main(async () => {
  const matcherDefPath = path.join(__dirname, '..', MATCHER_DEF_PATH);
  await writeFile(matcherDefPath, JSON.stringify(MATCHER.definition, null, 2) + '\n');
});

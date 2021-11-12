#!/usr/bin/env node

const {parseFormattedProblem} = require('../dist/github');
const {MATCHER_DEF_PATH} = require('../dist/hlint');
const {main, consumeStdin, readFile} = require('./_util');

const readMatcherDef = async () => JSON.parse(await readFile(MATCHER_DEF_PATH, 'utf8'));

main(async () => {
  const [matcherDef, input] = await Promise.all([
    readMatcherDef(),
    consumeStdin(),
  ]);

  const allParsed = (
    input
    .split('\n')
    .filter(Boolean)
    .map(line => parseFormattedProblem(matcherDef, line))
  );
  process.stdout.write(JSON.stringify(allParsed, null, 2) + '\n');
});

#!/usr/bin/env node

const {serializeProblem} = require('../dist/hlint');
const {main, consumeStdin} = require('./_util');

main(async () => {
  const input = await consumeStdin();
  const hlintJson = JSON.parse(input);
  hlintJson.map(serializeProblem).forEach(line => process.stdout.write(line + '\n'));
});

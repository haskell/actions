const fs = require('fs');
const {promisify} = require('util');
const {default: consumeStdin} = require('../dist/util/consumeStdin');

module.exports = {
  consumeStdin,
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  main: async (go) => {
      try {
        await go();
        process.exit(0);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
  },
};

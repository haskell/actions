module.exports = {
  'setup/!(*test).{js,ts,json}': [
    'eslint --cache --fix',
    () => 'ncc build',
    () => 'git add dist'
  ],
  'setup/src/**/*.ts': () => 'tsc -p tsconfig.json',
  'setup/*.{js,ts,json,md}': 'prettier --write'
};

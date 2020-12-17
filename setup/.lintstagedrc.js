module.exports = {
  '!(*test).{js,ts,json}': [
    'eslint --cache --fix',
    () => 'npm run bundle',
    () => 'git add setup/dist/ setup/lib/'
  ],
  'src/**/*.ts': () => 'tsc -p tsconfig.json',
  '*.{js,ts,json,md}': 'prettier --write'
};

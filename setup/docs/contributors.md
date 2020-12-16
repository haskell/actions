# Contributors

### Checkin

- Do checkin source (src)
- Do checkin build output (dist)
- Do checkin library build output (lib)

### Dependencies

In order to make sure that the ts files are always transpiled correctly, we run [Husky](https://github.com/typicode/husky) before each commit.
This step ensures that formatting rules are followed and that the typescript code has been transpiled correctly. To make sure Husky runs correctly, please use the following workflow:

```sh
npm install                                 # installs all dependencies including Husky
git add abc.ext                             # Add the files you've changed. This should include files in src and dist (see above)
git commit -m "Informative commit message"  # Commit. This will run Husky
```

During the commit step, Husky will take care of formatting all files with [Prettier](https://github.com/prettier/prettier).
It will also bundle the code into a single `dist/index.js` file and output the transpiled library under `lib/`.
Finally, it will make sure these changes are appropriately included in your commit--no further work is needed.

## Versions

Cabal does not follow SemVer and Stack has both SemVer compatible version numbers as well as PVP-style versions; due to this, support for "resolving" a version like `X.X` into the latest `X.X.Y` or `X.X.Y.Y` version is tricky.
To avoid complications, all recognized versions of GHC, Cabal, and Stack are in `src/versions.json`; these versions are supported across all three operating systems.
When a new release of GHC, Cabal, or Stack comes out, the `src/versions.json` file will need to be updated accordingly.

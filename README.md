# setup-haskell

<p align="left">
  <a href="https://github.com/actions/setup-haskell"><img alt="GitHub Actions status" src="https://github.com/actions/setup-haskell/workflows/Main%20workflow/badge.svg"></a>
</p>

This action sets up a Haskell environment for use in actions by:

- optionally installing a version of ghc and cabal and adding to PATH. Note that this action only uses versions of ghc and cabal already installed in the cache. The action will fail if no matching versions are found.
- registering problem matchers for error output

# Usage

See [action.yml](action.yml)

Basic:

``` yaml
steps:
- uses: actions/checkout@master
- uses: actions/setup-haskell@v1
  with:
    ghc-version: '8.6.5' # Version range or exact version of ghc to use, using semvers version range syntax.
- run: runghc Hello.hs
```

Matrix Testing:

``` yaml
jobs:
  build:
    runs-on: ubuntu-16.04
    strategy:
      matrix:
        ghc: [ '8.2.2', '8.6.5' ]
    name: Haskell GHC ${{ matrix.ghc }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup Haskell
        uses: actions/setup-haskell@v1
        with:
          ghc-version: ${{ matrix.ghc }}
      - run: runghc Hello.hs
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)

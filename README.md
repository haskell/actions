# setup-haskell

<p align="left">
  <a href="https://github.com/actions/setup-haskell"><img alt="GitHub Actions status" src="https://github.com/actions/setup-haskell/workflows/Main%20workflow/badge.svg"></a>
</p>

This action sets up a Haskell environment for use in actions by:

- optionally installing a version of ghc and cabal and adding to PATH. Note that this action only uses versions of ghc and cabal already installed in the cache. The action will fail if no matching versions are found.

## Usage

See [action.yml](action.yml)

Basic:

``` yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-haskell@v1
  with:
    ghc-version: '8.6.5' # Exact version of ghc to use
    cabal-version: '3.0'
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
        cabal: [ '2.0', '3.0' ]
    name: Haskell GHC ${{ matrix.ghc }} sample
    steps:
      - uses: actions/checkout@v1
      - name: Setup Haskell
        uses: actions/setup-haskell@v1
        with:
          ghc-version: ${{ matrix.ghc }}
          cabal-version: ${{ matrix.cabal }}
      - run: runghc Hello.hs
```

Supported versions of GHC:

- `8.0.2`
- `8.2.2`
- `8.4.4`
- `8.6.2`
- `8.6.3`
- `8.6.4`
- `8.6.5`
- `8.8.1`

Supported versions of Cabal:

- `2.0`
- `2.2`
- `2.4`
- `3.0`

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

## Contributions

Contributions are welcome!  See the [Contributor's Guide](docs/contributors.md).

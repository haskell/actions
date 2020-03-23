# setup-haskell

[![GitHub Actions status](https://github.com/actions/setup-haskell/workflows/Main%20workflow/badge.svg)](https://github.com/actions/setup-haskell)

This action installs a specified version of GHC and Cabal. It can also install [Stack](https://haskellstack.org).

Currently only Linux comes with [pre-installed versions of GHC and Cabal](https://github.com/actions/virtual-environments/blob/master/images/linux/Ubuntu1804-README.md). Those will be used whenever possible.
For all other versions and for Windows and macOS, this action utilizes [`ghcup`](https://gitlab.haskell.com/ghcup) and [`chocolatey`](https://chocolatey.org/packages/ghc).

## Usage

See [action.yml](action.yml)

Basic:

```yaml
on: [push]
name: build
jobs:
  runhaskell:
    name: Hello World
    runs-on: ubuntu-latest # or macOS-latest, or windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-haskell@v1
        with:
          ghc-version: '8.8.3' # Exact version of ghc to use
          cabal-version: '3.0.0.0'
      - run: runhaskell Hello.hs
```

Basic with Stack:

```yaml
on: [push]
name: build
jobs:
  runhaskell:
    name: Hello World
    runs-on: ubuntu-latest # or macOS-latest, or windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-haskell@v1
        with:
          ghc-version: '8.8.3' # Exact version of ghc to use
          cabal-version: '3.0.0.0'
          stack-version: 'latest'
      - run: runhaskell Hello.hs
```

Matrix Testing:

```yaml
on: [push]
name: build
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        ghc: ['8.6.5', '8.8.3']
        cabal: ['2.4.1.0', '3.0.0.0']
        os: [ubuntu-latest, macOS-latest, windows-latest]
        exclude:
          # GHC 8.8+ only works with cabal v3+
          - ghc: 8.8.3
            cabal: 2.4.1.0
    name: Haskell GHC ${{ matrix.ghc }} sample
    steps:
      - uses: actions/checkout@v2
      - name: Setup Haskell
        uses: actions/setup-haskell@v1
        with:
          ghc-version: ${{ matrix.ghc }}
          cabal-version: ${{ matrix.cabal }}
      - run: runhaskell Hello.hs
```

## Inputs

| Name              | Required | Description                                                                                                                                     | Type      | Default |
| ----------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `ghc-version`     |          | GHC version to use, ex. `8.8.3`                                                                                                                 | string    | 8.8.3   |
| `cabal-version`   |          | Cabal version to use, ex. `3.0.0.0`                                                                                                             | string    | 3.0.0.0 |
| `stack-version`   |          | Stack version to use, ex. `latest`. Stack will only be installed if this option is set                                                          | string    |         |
| `stack-no-global` |          | If specified, stack-version must be set. Prevents installing GHC and Cabal globally                                                             | "boolean" |         |
| `stack-setup-ghc` |          | If specified, stack-version must be set. Runs stack setup to install the specified GHC. (Note: setting this does _not_ imply `stack-no-global`) | "boolean" | 3.0.0.0 |

## Version Support

**GHC:**

- `8.8.3` (default)
- `8.8.2`
- `8.8.1`
- `8.6.5`
- `8.6.4`
- `8.6.3`
- `8.6.2`
- `8.6.1`
- `8.4.4`
- `8.4.3`
- `8.4.2`
- `8.4.1`
- `8.2.2`
- `8.0.2`
- `7.10.3`

**Cabal:**

- `3.0.0.0` (default)
- `2.4.1.0`
- `2.4.0.0`
- `2.2.0.0`

Recommendation: Cabal is almost always fully backwards compatible and so for most purposes, using the latest available version is sufficient

**Stack:**

- `latest` (recommended) -- follows the latest release automatically.
- `2.1.3`
- `2.1.1`
- `1.9.3.1`
- `1.9.1.1`
- `1.7.1`
- `1.6.5`
- `1.6.3.1`
- `1.6.1.1`
- `1.5.1`
- `1.5.0`

Recommendation: Stack follows SemVer, and additionally attempts to remain backwards compatible across major versions whenever reasonable. Using the latest available version is almost always sufficient

The full list of available versions of GHC, Cabal, and Stack are as follows:

- [Linux/macOS - Cabal and GHC](https://gitlab.haskell.org/haskell/ghcup/blob/master/.available-versions)
- [Windows - Cabal](https://chocolatey.org/packages/cabal#versionhistory).
- [Windows - GHC](https://chocolatey.org/packages/ghc#versionhistory)
- [Linux/macOS/Windows - Stack](https://github.com/commercialhaskell/stack/tags)

Note: There are _technically_ some descrepencies here. For example, "8.10.1-alpha1" will work for a ghc version for windows but not for Linux and macOS. For your sanity, I suggest sticking with the version lists above which are supported across all three operating systems.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

## Contributions

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).

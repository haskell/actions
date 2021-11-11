# haskell/actions/setup

[![GitHub Actions status](https://github.com/haskell/actions/workflows/Setup/badge.svg)](https://github.com/haskell/actions)

This action sets up a Haskell environment for use in actions by:

- optionally installing a version of [ghc](https://downloads.haskell.org/~ghc/latest/docs/html/users_guide/) and [cabal](https://www.haskell.org/cabal/) and adding to PATH.
- optionally installing a version of [Stack](https://haskellstack.org) and adding to PATH.
- setting the outputs of `ghc-path`, `cabal-path`, `stack-path`, and `cabal-store` when necessary.

The GitHub runners come with [pre-installed versions of GHC and Cabal](https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners). Those will be used whenever possible.
For all other versions, this action utilizes [`ppa:hvr/ghc`](https://launchpad.net/~hvr/+archive/ubuntu/ghc), [`ghcup`](https://gitlab.haskell.org/haskell/ghcup-hs), and [`chocolatey`](https://chocolatey.org/packages/ghc).

## Usage

See [action.yml](action.yml)

Minimal:

```yaml
on: [push]
name: build
jobs:
  runhaskell:
    name: Hello World
    runs-on: ubuntu-latest # or macOS-latest, or windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: haskell/actions/setup@v1
      - run: runhaskell Hello.hs
```

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
      - uses: haskell/actions/setup@v1
        with:
          ghc-version: '8.8' # Resolves to the latest point release of GHC 8.8
          cabal-version: '3.0.0.0' # Exact version of Cabal
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
      - uses: haskell/actions/setup@v1
        with:
          ghc-version: '8.8.3' # Exact version of ghc to use
          # cabal-version: 'latest'. Omitted, but defaults to 'latest'
          enable-stack: true
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
        uses: haskell/actions/setup@v1
        with:
          ghc-version: ${{ matrix.ghc }}
          cabal-version: ${{ matrix.cabal }}
      - run: runhaskell Hello.hs
```

## Inputs

| Name              | Required | Description                                                                                                                              | Type      | Default     |
| ----------------- | :------: | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `ghc-version`     |          | GHC version to use, ex. `latest`                                                                                                         | string    | latest      |
| `cabal-version`   |          | Cabal version to use, ex. `3.4`                                                                                                          | string    | latest      |
| `stack-version`   |          | Stack version to use, ex. `latest`. Stack will only be installed if `enable-stack` is set.                                               | string    | latest      |
| `enable-stack`    |          | If set, will setup Stack.                                                                                                                | "boolean" | false/unset |
| `stack-no-global` |          | If set, enable-stack must be set. Prevents installing GHC and Cabal globally                                                             | "boolean" | false/unset |
| `stack-setup-ghc` |          | If set, enable-stack must be set. Runs stack setup to install the specified GHC. (Note: setting this does _not_ imply `stack-no-global`) | "boolean" | false/unset |
| `disable-matcher` |          | If set, disables match messages from GHC as GitHub CI annotations                                                                        | "boolean" | false/unset |

Note: "boolean" types are set/unset, not true/false.
That is, setting any "boolean" to a value other than the empty string (`""`) will be considered true/set.

## Outputs

| Name          | Description                                                                                                                | Type   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| `ghc-path`    | The path of the ghc executable _directory_                                                                                 | string |
| `cabal-path`  | The path of the cabal executable _directory_                                                                               | string |
| `stack-path`  | The path of the stack executable _directory_                                                                               | string |
| `cabal-store` | The path to the cabal store                                                                                                | string |
| `stack-root`  | The path to the stack root (equal to the `STACK_ROOT` environment variable if it is set; otherwise an OS-specific default) | string |
| `ghc-exe`     | The path of the ghc _executable_                                                                                           | string |
| `cabal-exe`   | The path of the cabal _executable_                                                                                         | string |
| `stack-exe`   | The path of the stack _executable_                                                                                         | string |

## Version Support

**GHC:**

- `head`<sup>[[1]](#ghc-head-note-1)</sup>
- `latest` (default, recommended)
- `9.2.1` `9.2`
- `9.0.1` `9.0`
- `8.10.7` `8.10`
- `8.10.6`
- `8.10.5`
- `8.10.4`
- `8.10.3`
- `8.10.2`
- `8.10.1`
- `8.8.4` `8.8`
- `8.8.3`
- `8.8.2`
- `8.8.1`
- `8.6.5` `8.6`
- `8.6.4`
- `8.6.3`
- `8.6.2`
- `8.6.1`
- `8.4.4` `8.4`
- `8.4.3`
- `8.4.2`
- `8.4.1`
- `8.2.2` `8.2`
- `8.0.2` `8.0`
- `7.10.3` `7.10`

Suggestion: Try to support the three latest major versions of GHC.

<a name="ghc-head-note-1">[1]</a>: Only supported on linux, using GHC HEAD requires libgmb-dev and libtinfo-dev to be installed.

**Cabal:**

- `latest` (default, recommended)
- `3.6.2.0` `3.6`
- `3.6.0.0`
- `3.4.1.0` `3.4`
- `3.4.0.0`
- `3.2.0.0` `3.2`
- `3.0.0.0` `3.0`
- `2.4.1.0` `2.4`

Recommendation: Use the latest available version if possible.

**Stack:**

- `latest` (recommended) -- follows the latest release automatically.
- `2.7.3` `2.7`
- `2.7.1`
- `2.5.1` `2.5`
- `2.3.3` `2.3`
- `2.3.1`
- `2.1.3` `2.1`
- `2.1.1`
- `1.9.3.1` `1.9`
- `1.9.1.1`
- `1.7.1` `1.7`
- `1.6.5` `1.6`
- `1.6.3.1`
- `1.6.1.1`
- `1.5.1` `1.5`
- `1.5.0`
- `1.4.0` `1.4`
- `1.3.2` `1.3`
- `1.3.0`
- `1.2.0` `1.2`

Recommendation: Use the latest available version if possible.

The full list of available versions of GHC, Cabal, and Stack are as follows:

- [Linux/macOS - Cabal and GHC](https://www.haskell.org/ghc/download.html)
- [Windows - Cabal](https://chocolatey.org/packages/cabal#versionhistory).
- [Windows - GHC](https://chocolatey.org/packages/ghc#versionhistory)
- [Linux/macOS/Windows - Stack](https://github.com/commercialhaskell/stack/tags)

Note: There are _technically_ some discrepancies here. For example, "8.10.1-alpha1" will work for a ghc version for windows but not for Linux and macOS. For your sanity, I suggest sticking with the version lists above which are supported across all three operating systems.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

## Contributions

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).

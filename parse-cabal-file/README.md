# parse-cabal-file

GitHub Action: Parse Cabal file

## Inputs

* `cabal_file` (required): The path to a cabal file

## Outputs

* `version`: The version in the Cabal file

## Example

```yaml
name: Release
on:
  push:
    branches:
      - 'releases/*'

jobs:
  hlint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - uses: haskell/actions/parse-cabal-file@main
      id: cabal_file
      with:
        cabal_file: my-library.cabal

    - run: echo ${{ steps.cabal_file.outputs.version }}
```

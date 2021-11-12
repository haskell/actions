# rwe/actions-hlint-setup

GitHub Action: Set up hlint

Downloads and a binary HLint release from [@ndmitchell/hlint](https://github.com/ndmitchell/hlint).

The release is cached using [@actions/tool-cache](https://github.com/actions/tool-cache) and is added to `PATH`.

See also [rwe/actions-hlint-run](https://github.com/rwe/actions-hlint-run), which will run hlint and format its output for GitHub annotations.

## Inputs

* `version`: The HLint version to download. Defaults to `3.1.6`.

## Outputs

* `hlint-dir`: Resulting directory containing the hlint executable
* `hlint-bin`: Location of the hlint executable
* `version`: Version of the hlint tool (same as input, if provided)

## Example

```yaml
name: lint
on:
  pull_request:
  push:
    branches:
      - master
      - 'releases/*'

jobs:
  hlint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: 'Set up HLint'
      uses: rwe/actions-hlint-setup@v1
      with:
        version: '3.1.6'

    - name: 'Run HLint'
      uses: rwe/actions-hlint-run@v1
      with:
        path: src/
        fail-on: warning
```

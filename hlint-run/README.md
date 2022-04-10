# hlint-run

GitHub Action: Run hlint

See also [haskell/actions/hlint-setup](https://github.com/haskell/actions/tree/main/hlint-setup), which will install (and cache) HLint.

Executes `hlint` and presents the output using
[actions/toolkit/commands/problem matcher](https://github.com/actions/toolkit/blob/1cc56db0ff126f4d65aeb83798852e02a2c180c3/docs/commands.md#problem-matchers),
so hints are displayed as GitHub annotations.

## Inputs

* `fail-on` (optional, default: _never_): When to mark the check as failed.
  One of: `never`, `status`, `warning`, `suggestion`, or `error`.
* `path` (required): The single file or directory name, or formatted JSON array containing multiple.
  Examples:
  * `- path: src/`
  * `- path: '["src/", "test/"]'`
  * `- path: ${{ toJSON(steps.whatever.changed_dirs) }}` (see: docs on [toJSON](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#tojson))
* `hlint-bin` (optional): The `hlint` binary path, if not already in `PATH`.

## Outputs

The main purpose of this action currently is just to print out GitHub annotations, but it still provides an output.

* `ideas`: The generated HLint ideas (warnings, errors, etc.) serialized to JSON.

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
    - uses: actions/checkout@v3

    - name: 'Set up HLint'
      uses: haskell/actions/hlint-setup@v2
      with:
        version: '3.1.6'

    - name: 'Run HLint'
      uses: haskell/actions/hlint-run@v2
      with:
        path: src/
        fail-on: warning
```

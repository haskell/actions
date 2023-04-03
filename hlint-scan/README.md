# haskell/actions/hlint-scan

This action scans Haskell code using [HLint] and uploads its suggested improvements to [GitHub code scanning].

This needs HLint to be set up.  This can be taken care of by [haskell/actions/hlint-setup](../hlint-setup/).

[HLint]: https://github.com/ndmitchell/hlint
[GitHub code scanning]: https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning

## Usage

A minimual example for setting up code scanning with HLint:

```yaml
on:
  push:
    branches: ['main']

jobs:
  scan:
    name: Scan code with HLint
    runs-on: ubuntu-latest
    permissions:
      # Needed to upload results to GitHub code scanning.
      security-events: write
    steps:
      - uses: actions/checkout@v3
      - uses: haskell/actions/hlint-setup@v2
      - uses: haskell/actions/hlint-scan@v2
```

### Inputs

None of the inputs are required.  You only need to set them if the defaults do not work for your situation.

`hlint-bin`
:   Path to the hlint binary.

`args`
:   Extra arguments to pass to HLint.

`path`
:   Path or array of paths that HLint will be told to scan.

`sarif_file`
:   The name of the SARIF file to write and upload to GItHub code scanning.

`category`
:   String used by GitHub code scanning for matching the analyses.

### Outputs

`sarif-id`
:   The ID of the uploaded SARIF file.

## Note

This does not fail the workflow when HLint finds any code which could be improved.
In other words, this action is not intended to be used as a status check.
Instead, its goal is to file [GitHub code scanning] alerts.

To use HLint for status checks, e.g., during pushes or pull requests,
see [haskell/actions/hlint-run](../hlint-run/) instead.

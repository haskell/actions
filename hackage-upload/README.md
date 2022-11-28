# hackage-upload

GitHub Action: Hackage upload

Uploads an sdist archive to Hackage.

## Inputs

* `archive` (required): The archive created by `stack sdist` or `cabal sdist` to upload. (globs allowed)

* `token` (required): An auth token from Hackage, which can be generated at `https://hackage.haskell.org/user/$USERNAME/manage`

* `candidate` (optional): Whether to upload as a package candidate or not.
    * Defaults to `true` because Hackage uploads are permanent, and it's usually not a good idea to do irreversible actions in an automatic pipeline. But if you absolutely want to skip the candidate step, set this to `false`.

* `url` (optional): The Hackage URL to upload to (e.g. for self-hosted Hackage instances)

## Outputs

N/A

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

    - run: stack sdist

    - uses: haskell/actions/hackage-upload@main
      with:
        archive: my-library-*.tar.gz
        token: ${{ secrets.HACKAGE_TOKEN }}
```

One particularly useful workflow is to be able to use the hackage token associated with the GitHub user running the workflow. This allows multiple maintainers to use their own tokens and not have to share one user's token.

```yaml
- name: Load Hackage token secret name
  id: hackage_token_secret
  run: |
    USERNAME="$(echo "${GITHUB_ACTOR}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')"
    echo "name=HACKAGE_TOKEN_${USERNAME}" >> "${GITHUB_OUTPUT}"

- uses: haskell/actions/hackage-upload@main
  with:
    archive: my-library-*.tar.gz
    token: ${{ secrets[steps.hackage_token_secret.outputs.name] }}
```

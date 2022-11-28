#!/usr/bin/python3

import os
import requests
from glob import glob
from pathlib import Path


def main():
    archive = get_archive()
    token = get_token()
    candidate = get_candidate()
    url = get_url()

    path = "/packages/candidates" if candidate else "/packages"

    with archive.open("rb") as f:
        r = requests.post(
            url + path,
            headers={"Authorization": f"X-ApiKey {token}"},
            files={"package": f},
        )
        r.raise_for_status()

    print(f"Successfully uploaded {archive}!")


def get_archive() -> Path:
    archive_glob = os.environ["INPUT_ARCHIVE"]
    matches = glob(archive_glob)
    if len(matches) == 0:
        raise Exception(f"Found no sdist archives matching: {archive_glob}")
    elif len(matches) > 1:
        raise Exception(
            f'Found multiple sdist archives matching "{archive_glob}": {matches}'
        )

    return Path(matches[0])


def get_token() -> str:
    token = os.environ["INPUT_TOKEN"]
    if not token:
        raise Exception("Token was not provided")
    return token


def get_candidate() -> bool:
    candidate = os.environ["INPUT_CANDIDATE"]
    if candidate == "true":
        return True
    elif candidate == "false":
        return False
    else:
        raise Exception(f"Invalid value for candidate: {candidate}")

def get_url() -> str:
    url = os.environ["INPUT_URL"]
    if not url:
        raise Exception("URL was not provided")
    return url


if __name__ == "__main__":
    main()

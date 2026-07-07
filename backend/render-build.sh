#!/usr/bin/env bash
set -e

python3 -m pip install --upgrade pip
python3 -m pip install --only-binary=:all: -r requirements.txt

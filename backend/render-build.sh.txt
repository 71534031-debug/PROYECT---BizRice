#!/usr/bin/env bash

apt-get update

ACCEPT_EULA=Y apt-get install -y msodbcsql18

pip install -r requirements.txt
#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running migrations"
python EcoTrack/manage.py makemigrations
python EcoTrack/manage.py migrate --noinput

echo "==> Collecting static files"
python EcoTrack/manage.py collectstatic --noinput

echo "==> Build complete"

#!/bin/bash

# Скрипт для запуска бэкенда
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
python main.py

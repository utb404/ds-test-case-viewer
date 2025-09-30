#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных с примерами данных
"""

import json
import sys
import os
from datetime import datetime

# Добавляем путь к модулям проекта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import TestCase, Folder
from services import TestCaseService, FolderService

def init_database():
    """Создает таблицы в базе данных"""
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы созданы")

def load_sample_data():
    """Загружает примеры данных из файла"""
    try:
        with open('sample_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Файл sample_data.json не найден")
        return
    
    db = SessionLocal()
    test_case_service = TestCaseService()
    folder_service = FolderService()
    
    try:
        # Загружаем папки
        for folder_data in data.get('folders', []):
            folder = Folder(
                id=folder_data['id'],
                name=folder_data['name'],
                parent_id=folder_data.get('parent_id'),
                created_at=datetime.fromisoformat(folder_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(folder_data['updated_at'].replace('Z', '+00:00'))
            )
            db.add(folder)
        
        # Загружаем тест-кейсы
        for tc_data in data.get('test_cases', []):
            test_case = TestCase(
                id=tc_data['id'],
                title=tc_data['title'],
                author=tc_data['author'],
                description=tc_data.get('description'),
                precondition=tc_data.get('precondition'),
                status=tc_data['status'],
                use_case_id=tc_data.get('use_case_id'),
                folder_id=tc_data.get('folder_id'),
                tags=tc_data.get('tags', []),
                steps=tc_data.get('steps', []),
                labels=tc_data.get('labels', []),
                created_at=datetime.fromisoformat(tc_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(tc_data['updated_at'].replace('Z', '+00:00')) if tc_data.get('updated_at') else None
            )
            db.add(test_case)
        
        db.commit()
        print("✅ Примеры данных загружены")
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке данных: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Основная функция инициализации"""
    print("🚀 Инициализация базы данных...")
    
    init_database()
    load_sample_data()
    
    print("✅ Инициализация завершена!")
    print("\nДля запуска приложения:")
    print("1. Бэкенд: python main.py")
    print("2. Фронтенд: cd ../frontend && npm install && npm start")

if __name__ == "__main__":
    main()

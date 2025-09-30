# Test Case Viewer

Система для просмотра и редактирования тест-кейсов с современным веб-интерфейсом.

## Технологии

- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Alembic
- **Frontend**: React, TypeScript, Consta Design System
- **Package Manager**: uv (Python), npm (Node.js)
- **Deployment**: Docker, Docker Compose

## Быстрый старт

### Предварительные требования

- [uv](https://astral.sh/uv/) - современный менеджер пакетов Python
- [Node.js](https://nodejs.org/) 18+ и npm
- [Docker](https://www.docker.com/) и Docker Compose

### Установка uv

```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Запуск проекта

1. **Автоматическая настройка:**
   ```bash
   ./setup.sh
   ```

2. **Запуск в Docker:**
   ```bash
   docker-compose up
   ```

3. **Доступ к приложению:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API документация: http://localhost:8000/docs

## Разработка

### Backend (Python)

```bash
cd backend

# Установка зависимостей
uv sync

# Запуск сервера разработки
uv run uvicorn main:app --reload

# Добавление новых зависимостей
uv add package-name

# Добавление dev зависимостей
uv add --dev package-name

# Запуск тестов
uv run pytest

# Форматирование кода
uv run black .
uv run isort .

# Проверка типов
uv run mypy .
```

### Frontend (React)

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start

# Сборка для продакшена
npm run build

# Запуск тестов
npm test
```

## Структура проекта

```
test-viewer/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Точка входа приложения
│   ├── models.py           # SQLAlchemy модели
│   ├── schemas.py          # Pydantic схемы
│   ├── services.py         # Бизнес-логика
│   ├── database.py         # Настройка БД
│   └── init_db.py          # Инициализация БД
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.tsx         # Главный компонент
│   │   └── App.css         # Стили
│   └── package.json        # Node.js зависимости
├── pyproject.toml          # uv конфигурация
├── uv.lock                 # uv lock файл
├── docker-compose.yml      # Docker конфигурация
├── setup.sh               # Скрипт настройки
└── README.md              # Документация
```

## Функциональность

### Основные возможности

- 📁 **Управление папками**: создание, редактирование, удаление папок
- 📄 **Управление тест-кейсами**: CRUD операции для тест-кейсов
- 🔍 **Поиск и фильтрация**: поиск по тексту, фильтрация по автору, статусу, тегам
- 🎯 **Drag & Drop**: перемещение тест-кейсов между папками
- 📊 **Экспорт/Импорт**: работа с JSON файлами
- 🎨 **Современный UI**: интерфейс на базе Consta Design System

### Структура тест-кейса

```json
{
  "id": "uuid",
  "title": "Название тест-кейса",
  "author": "Автор",
  "status": "draft|design|done",
  "description": "Описание",
  "precondition": "Предусловия",
  "steps": [
    {
      "step": "Описание шага",
      "expected_res": "Ожидаемый результат"
    }
  ],
  "tags": ["тег1", "тег2"],
  "labels": [
    {
      "name": "epic",
      "value": "Значение"
    }
  ]
}
```

## API Endpoints

### Тест-кейсы
- `GET /api/test-cases` - получить все тест-кейсы
- `POST /api/test-cases` - создать тест-кейс
- `GET /api/test-cases/{id}` - получить тест-кейс по ID
- `PUT /api/test-cases/{id}` - обновить тест-кейс
- `DELETE /api/test-cases/{id}` - удалить тест-кейс
- `POST /api/test-cases/{id}/clone` - клонировать тест-кейс

### Папки
- `GET /api/folders` - получить все папки
- `POST /api/folders` - создать папку
- `GET /api/folders/{id}` - получить папку по ID
- `PUT /api/folders/{id}` - обновить папку
- `DELETE /api/folders/{id}` - удалить папку

### Экспорт/Импорт
- `GET /api/export` - экспорт всех данных
- `POST /api/import` - импорт данных

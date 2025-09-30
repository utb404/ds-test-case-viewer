from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from database import get_db, engine, Base
from models import TestCase, Folder, TestCaseHistory
from schemas import (
    TestCaseCreate, TestCaseUpdate, TestCaseResponse,
    FolderCreate, FolderUpdate, FolderResponse,
    TestCaseHistoryResponse
)
from services import TestCaseService, FolderService

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Test Case Viewer API", version="1.0.0")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статических файлов для фронтенда (отключено для Docker)
# app.mount("/static", StaticFiles(directory="../frontend/build"), name="static")

# Инициализация сервисов
test_case_service = TestCaseService()
folder_service = FolderService()

@app.get("/")
async def root():
    return {"message": "Test Case Viewer API"}

# API для тест-кейсов
@app.get("/api/test-cases", response_model=List[TestCaseResponse])
async def get_test_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return test_case_service.get_test_cases(db, skip=skip, limit=limit)

@app.get("/api/test-cases/{test_case_id}", response_model=TestCaseResponse)
async def get_test_case(test_case_id: str, db: Session = Depends(get_db)):
    test_case = test_case_service.get_test_case(db, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case

@app.post("/api/test-cases", response_model=TestCaseResponse)
async def create_test_case(test_case: TestCaseCreate, db: Session = Depends(get_db)):
    return test_case_service.create_test_case(db, test_case)

@app.put("/api/test-cases/{test_case_id}", response_model=TestCaseResponse)
async def update_test_case(test_case_id: str, test_case: TestCaseUpdate, db: Session = Depends(get_db)):
    updated_test_case = test_case_service.update_test_case(db, test_case_id, test_case)
    if not updated_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return updated_test_case

@app.delete("/api/test-cases/{test_case_id}")
async def delete_test_case(test_case_id: str, db: Session = Depends(get_db)):
    success = test_case_service.delete_test_case(db, test_case_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test case not found")
    return {"message": "Test case deleted successfully"}

@app.post("/api/test-cases/{test_case_id}/clone", response_model=TestCaseResponse)
async def clone_test_case(test_case_id: str, db: Session = Depends(get_db)):
    cloned_test_case = test_case_service.clone_test_case(db, test_case_id)
    if not cloned_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return cloned_test_case

@app.get("/api/test-cases/{test_case_id}/history", response_model=List[TestCaseHistoryResponse])
async def get_test_case_history(test_case_id: str, db: Session = Depends(get_db)):
    return test_case_service.get_test_case_history(db, test_case_id)

# API для папок
@app.get("/api/folders", response_model=List[FolderResponse])
async def get_folders(db: Session = Depends(get_db)):
    return folder_service.get_folders(db)

@app.get("/api/folders/{folder_id}", response_model=FolderResponse)
async def get_folder(folder_id: str, db: Session = Depends(get_db)):
    folder = folder_service.get_folder(db, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@app.post("/api/folders", response_model=FolderResponse)
async def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    return folder_service.create_folder(db, folder)

@app.put("/api/folders/{folder_id}", response_model=FolderResponse)
async def update_folder(folder_id: str, folder: FolderUpdate, db: Session = Depends(get_db)):
    updated_folder = folder_service.update_folder(db, folder_id, folder)
    if not updated_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return updated_folder

@app.delete("/api/folders/{folder_id}")
async def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    success = folder_service.delete_folder(db, folder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"message": "Folder deleted successfully"}

# API для поиска и фильтрации
@app.get("/api/search")
async def search_test_cases(
    query: Optional[str] = None,
    tags: Optional[str] = None,
    status: Optional[str] = None,
    author: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return test_case_service.search_test_cases(db, query, tags, status, author)

# API для экспорта/импорта
@app.get("/api/export")
async def export_test_cases(db: Session = Depends(get_db)):
    return test_case_service.export_test_cases(db)

@app.post("/api/import")
async def import_test_cases(data: dict, db: Session = Depends(get_db)):
    return test_case_service.import_test_cases(db, data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

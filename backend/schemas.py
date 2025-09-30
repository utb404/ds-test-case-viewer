from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Схемы для шагов тест-кейса
class TestStep(BaseModel):
    step: str
    expected_res: str

# Схемы для лейблов
class Label(BaseModel):
    name: str
    value: str

# Схемы для тест-кейсов
class TestCaseBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    precondition: Optional[str] = None
    status: str = "draft"
    use_case_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    steps: List[TestStep] = Field(default_factory=list)
    labels: List[Label] = Field(default_factory=list)

class TestCaseCreate(TestCaseBase):
    folder_id: Optional[str] = None

class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    precondition: Optional[str] = None
    status: Optional[str] = None
    use_case_id: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    steps: Optional[List[TestStep]] = None
    labels: Optional[List[Label]] = None

class TestCaseResponse(TestCaseBase):
    id: str
    folder_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Схемы для папок
class FolderBase(BaseModel):
    name: str
    parent_id: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None

class FolderResponse(FolderBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Схемы для истории изменений
class TestCaseHistoryResponse(BaseModel):
    id: str
    test_case_id: str
    action: str
    changes: Optional[Dict[str, Any]] = None
    created_at: datetime
    user: Optional[str] = None
    
    class Config:
        from_attributes = True

# Схемы для поиска
class SearchFilters(BaseModel):
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    author: Optional[str] = None
    folder_id: Optional[str] = None

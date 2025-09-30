from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from models import TestCase, Folder, TestCaseHistory
from schemas import TestCaseCreate, TestCaseUpdate, FolderCreate, FolderUpdate
import uuid
from datetime import datetime

class TestCaseService:
    def get_test_cases(self, db: Session, skip: int = 0, limit: int = 100) -> List[TestCase]:
        return db.query(TestCase).offset(skip).limit(limit).all()
    
    def get_test_case(self, db: Session, test_case_id: str) -> Optional[TestCase]:
        return db.query(TestCase).filter(TestCase.id == test_case_id).first()
    
    def create_test_case(self, db: Session, test_case: TestCaseCreate) -> TestCase:
        db_test_case = TestCase(
            id=str(uuid.uuid4()),
            title=test_case.title,
            author=test_case.author,
            description=test_case.description,
            precondition=test_case.precondition,
            status=test_case.status,
            use_case_id=test_case.use_case_id,
            folder_id=test_case.folder_id,
            tags=test_case.tags,
            steps=[step.dict() for step in test_case.steps],
            labels=[label.dict() for label in test_case.labels]
        )
        db.add(db_test_case)
        db.commit()
        db.refresh(db_test_case)
        
        # Создаем запись в истории
        self._create_history_record(db, db_test_case.id, "created", None)
        
        return db_test_case
    
    def update_test_case(self, db: Session, test_case_id: str, test_case: TestCaseUpdate) -> Optional[TestCase]:
        db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
        if not db_test_case:
            return None
        
        # Сохраняем старые значения для истории
        old_values = {
            "title": db_test_case.title,
            "author": db_test_case.author,
            "description": db_test_case.description,
            "precondition": db_test_case.precondition,
            "status": db_test_case.status,
            "tags": db_test_case.tags,
            "steps": db_test_case.steps,
            "labels": db_test_case.labels
        }
        
        # Обновляем поля
        update_data = test_case.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field in ["steps", "labels"] and value is not None:
                setattr(db_test_case, field, [item.dict() if hasattr(item, 'dict') else item for item in value])
            else:
                setattr(db_test_case, field, value)
        
        db.commit()
        db.refresh(db_test_case)
        
        # Создаем запись в истории
        changes = {k: v for k, v in update_data.items() if old_values.get(k) != v}
        if changes:
            self._create_history_record(db, test_case_id, "updated", changes)
        
        return db_test_case
    
    def delete_test_case(self, db: Session, test_case_id: str) -> bool:
        db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
        if not db_test_case:
            return False
        
        # Сначала удаляем все связанные записи истории
        db.query(TestCaseHistory).filter(TestCaseHistory.test_case_id == test_case_id).delete()
        
        # Затем удаляем сам тест-кейс
        db.delete(db_test_case)
        db.commit()
        return True
    
    def clone_test_case(self, db: Session, test_case_id: str) -> Optional[TestCase]:
        original = db.query(TestCase).filter(TestCase.id == test_case_id).first()
        if not original:
            return None
        
        cloned_test_case = TestCase(
            id=str(uuid.uuid4()),
            title=f"Копия – {original.title}",
            author=original.author,
            description=original.description,
            precondition=original.precondition,
            status="draft",  # Клонированные тест-кейсы всегда в статусе draft
            use_case_id=original.use_case_id,
            folder_id=original.folder_id,
            tags=original.tags.copy() if original.tags else [],
            steps=original.steps.copy() if original.steps else [],
            labels=original.labels.copy() if original.labels else []
        )
        
        db.add(cloned_test_case)
        db.commit()
        db.refresh(cloned_test_case)
        
        # Создаем запись в истории
        self._create_history_record(db, cloned_test_case.id, "created", {"cloned_from": test_case_id})
        
        return cloned_test_case
    
    def get_test_case_history(self, db: Session, test_case_id: str) -> List[TestCaseHistory]:
        return db.query(TestCaseHistory).filter(TestCaseHistory.test_case_id == test_case_id).order_by(TestCaseHistory.created_at.desc()).all()
    
    def search_test_cases(self, db: Session, query: Optional[str] = None, tags: Optional[str] = None, 
                         status: Optional[str] = None, author: Optional[str] = None) -> List[TestCase]:
        filters = []
        
        if query:
            filters.append(or_(
                TestCase.title.ilike(f"%{query}%"),
                TestCase.description.ilike(f"%{query}%")
            ))
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            for tag in tag_list:
                filters.append(TestCase.tags.contains([tag]))
        
        if status:
            filters.append(TestCase.status == status)
        
        if author:
            filters.append(TestCase.author.ilike(f"%{author}%"))
        
        return db.query(TestCase).filter(and_(*filters)).all()
    
    def export_test_cases(self, db: Session) -> Dict[str, Any]:
        test_cases = db.query(TestCase).all()
        folders = db.query(Folder).all()
        
        return {
            "test_cases": [
                {
                    "id": tc.id,
                    "title": tc.title,
                    "author": tc.author,
                    "description": tc.description,
                    "precondition": tc.precondition,
                    "status": tc.status,
                    "use_case_id": tc.use_case_id,
                    "folder_id": tc.folder_id,
                    "tags": tc.tags,
                    "steps": tc.steps,
                    "labels": tc.labels,
                    "created_at": tc.created_at.isoformat() if tc.created_at else None,
                    "updated_at": tc.updated_at.isoformat() if tc.updated_at else None
                }
                for tc in test_cases
            ],
            "folders": [
                {
                    "id": f.id,
                    "name": f.name,
                    "parent_id": f.parent_id,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                    "updated_at": f.updated_at.isoformat() if f.updated_at else None
                }
                for f in folders
            ]
        }
    
    def import_test_cases(self, db: Session, data: Dict[str, Any]) -> Dict[str, int]:
        imported_count = 0
        error_count = 0
        
        try:
            # Импорт папок
            if "folders" in data:
                for folder_data in data["folders"]:
                    try:
                        folder = Folder(
                            id=folder_data["id"],
                            name=folder_data["name"],
                            parent_id=folder_data.get("parent_id")
                        )
                        db.add(folder)
                        imported_count += 1
                    except Exception:
                        error_count += 1
            
            # Импорт тест-кейсов
            if "test_cases" in data:
                for tc_data in data["test_cases"]:
                    try:
                        test_case = TestCase(
                            id=tc_data["id"],
                            title=tc_data["title"],
                            author=tc_data["author"],
                            description=tc_data.get("description"),
                            precondition=tc_data.get("precondition"),
                            status=tc_data.get("status", "draft"),
                            use_case_id=tc_data.get("use_case_id"),
                            folder_id=tc_data.get("folder_id"),
                            tags=tc_data.get("tags", []),
                            steps=tc_data.get("steps", []),
                            labels=tc_data.get("labels", [])
                        )
                        db.add(test_case)
                        imported_count += 1
                    except Exception:
                        error_count += 1
            
            db.commit()
        except Exception:
            db.rollback()
            error_count += 1
        
        return {"imported": imported_count, "errors": error_count}
    
    def _create_history_record(self, db: Session, test_case_id: str, action: str, changes: Optional[Dict[str, Any]]):
        history_record = TestCaseHistory(
            id=str(uuid.uuid4()),
            test_case_id=test_case_id,
            action=action,
            changes=changes,
            user="system"  # В реальном приложении здесь будет текущий пользователь
        )
        db.add(history_record)
        db.commit()

class FolderService:
    def get_folders(self, db: Session) -> List[Folder]:
        return db.query(Folder).all()
    
    def get_folder(self, db: Session, folder_id: str) -> Optional[Folder]:
        return db.query(Folder).filter(Folder.id == folder_id).first()
    
    def create_folder(self, db: Session, folder: FolderCreate) -> Folder:
        db_folder = Folder(
            id=str(uuid.uuid4()),
            name=folder.name,
            parent_id=folder.parent_id
        )
        db.add(db_folder)
        db.commit()
        db.refresh(db_folder)
        return db_folder
    
    def update_folder(self, db: Session, folder_id: str, folder: FolderUpdate) -> Optional[Folder]:
        db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not db_folder:
            return None
        
        update_data = folder.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_folder, field, value)
        
        db.commit()
        db.refresh(db_folder)
        return db_folder
    
    def delete_folder(self, db: Session, folder_id: str) -> bool:
        db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not db_folder:
            return False
        
        # Получаем все дочерние папки (рекурсивно)
        def get_all_child_folders(parent_id: str) -> List[str]:
            child_folders = db.query(Folder).filter(Folder.parent_id == parent_id).all()
            all_children = []
            for child in child_folders:
                all_children.append(child.id)
                # Рекурсивно получаем детей детей
                all_children.extend(get_all_child_folders(child.id))
            return all_children
        
        # Получаем все дочерние папки
        child_folder_ids = get_all_child_folders(folder_id)
        
        # Перемещаем все тест-кейсы из удаляемой папки и её дочерних папок в корень
        all_folder_ids = [folder_id] + child_folder_ids
        db.query(TestCase).filter(TestCase.folder_id.in_(all_folder_ids)).update(
            {TestCase.folder_id: None}, synchronize_session=False
        )
        
        # Удаляем все дочерние папки (в обратном порядке, чтобы избежать проблем с foreign key)
        for child_id in reversed(child_folder_ids):
            db.query(Folder).filter(Folder.id == child_id).delete()
        
        # Удаляем саму папку
        db.delete(db_folder)
        db.commit()
        return True

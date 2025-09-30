from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
from datetime import datetime
from typing import List, Optional

class Folder(Base):
    __tablename__ = "folders"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    parent_id = Column(String, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    children = relationship("Folder", backref="parent", remote_side=[id])
    test_cases = relationship("TestCase", back_populates="folder")

class TestCase(Base):
    __tablename__ = "test_cases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    precondition = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft, design, done
    use_case_id = Column(String, nullable=True)
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    
    # JSON поля для сложных структур
    tags = Column(JSON, nullable=True, default=list)
    steps = Column(JSON, nullable=True, default=list)
    labels = Column(JSON, nullable=True, default=list)
    
    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    folder = relationship("Folder", back_populates="test_cases")
    history = relationship("TestCaseHistory", back_populates="test_case")

class TestCaseHistory(Base):
    __tablename__ = "test_case_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)
    action = Column(String, nullable=False)  # created, updated, deleted
    changes = Column(JSON, nullable=True)  # Детали изменений
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = Column(String, nullable=True)
    
    # Связи
    test_case = relationship("TestCase", back_populates="history")

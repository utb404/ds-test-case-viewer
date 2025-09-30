import React, { useState, useEffect } from 'react';
import { Theme } from '@consta/uikit/Theme';
import { presetGpnDefault } from '@consta/uikit/Theme';
import { Layout } from '@consta/uikit/Layout';
import { Text } from '@consta/uikit/Text';
import { Button } from '@consta/uikit/Button';
import { Card } from '@consta/uikit/Card';
import { TextField } from '@consta/uikit/TextField';
import { Select } from '@consta/uikit/Select';
import { Badge } from '@consta/uikit/Badge';
import { Modal } from '@consta/uikit/Modal';
// Импорты иконок
import { IconAdd } from '@consta/icons/IconAdd';
import { IconTrash } from '@consta/icons/IconTrash';
import { IconEdit } from '@consta/icons/IconEdit';
import { IconCopy } from '@consta/icons/IconCopy';
import { IconFolderClosed } from '@consta/icons/IconFolderClosed';
import { IconSave } from '@consta/icons/IconSave';
import { IconCancel } from '@consta/icons/IconCancel';
import { IconDownload } from '@consta/icons/IconDownload';
import { IconFolderOpen } from '@consta/icons/IconFolderOpen';
import { IconDocFilled } from '@consta/icons/IconDocFilled';
import { IconCheck } from '@consta/icons/IconCheck';
import { IconHamburger } from '@consta/icons/IconHamburger';
import { IconClose } from '@consta/icons/IconClose';
import { IconFilter } from '@consta/icons/IconFilter';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './App.css';

interface TestCase {
  id: string;
  title: string;
  author: string;
  description?: string;
  precondition?: string;
  status: string;
  tags: string[];
  steps: Array<{ step: string; expected_res: string }>;
  labels: Array<{ name: string; value: string }>;
  folder_id?: string;
}

interface Folder {
  id: string;
  name: string;
  parent_id?: string;
}

function App() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<Partial<TestCase>>({});
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentFolder, setSelectedParentFolder] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Фильтры
  const [filters, setFilters] = useState({
    author: '',
    status: '',
    tags: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Дизайн', value: 'design' },
    { label: 'Готово', value: 'done' },
  ];

  useEffect(() => {
    fetchTestCases();
    fetchFolders();
  }, []);

  const fetchTestCases = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/test-cases');
      const data = await response.json();
      setTestCases(data);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const filteredTestCases = testCases.filter(testCase => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      testCase.title.toLowerCase().includes(query) ||
      testCase.author.toLowerCase().includes(query) ||
      testCase.description?.toLowerCase().includes(query) ||
      testCase.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Функция для получения всех тест-кейсов и папок для поиска
  const getSearchResults = () => {
    if (!searchQuery) return null;
    
    const query = searchQuery.toLowerCase();
    const matchingTestCases = testCases.filter(testCase => 
      testCase.title.toLowerCase().includes(query) ||
      testCase.author.toLowerCase().includes(query) ||
      testCase.description?.toLowerCase().includes(query) ||
      testCase.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    const matchingFolders = folders.filter(folder =>
      folder.name.toLowerCase().includes(query)
    );
    
    return { testCases: matchingTestCases, folders: matchingFolders };
  };

  // Функции для работы с фильтрами
  const getAllAuthors = () => {
    const authors = [...new Set(testCases.map(tc => tc.author))];
    return authors.sort();
  };

  const getAllTags = () => {
    const allTags = testCases.flatMap(tc => tc.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  };

  const getFilteredTestCases = () => {
    return testCases.filter(testCase => {
      // Фильтр по автору
      if (filters.author && testCase.author !== filters.author) {
        return false;
      }
      
      // Фильтр по статусу
      if (filters.status && testCase.status !== filters.status) {
        return false;
      }
      
      // Фильтр по тегам
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          testCase.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      author: '',
      status: '',
      tags: []
    });
  };

  const hasActiveFilters = () => {
    return filters.author || filters.status || filters.tags.length > 0;
  };

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCreateTestCase = async () => {
    try {
      const testCaseData = {
        title: newTestCase.title || 'Новый тест-кейс',
        author: newTestCase.author || 'Автор',
        description: newTestCase.description || '',
        precondition: newTestCase.precondition || '',
        status: newTestCase.status || 'draft',
        tags: newTestCase.tags || [],
        steps: newTestCase.steps || [],
        labels: newTestCase.labels || [],
        folder_id: newTestCase.folder_id || null
      };

      const response = await fetch('http://localhost:8000/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCaseData)
      });

      if (response.ok) {
        const created = await response.json();
        setTestCases([...testCases, created]);
        setSelectedTestCase(created);
        setShowCreateModal(false);
        setNewTestCase({});
      }
    } catch (error) {
      console.error('Error creating test case:', error);
    }
  };

  const handleUpdateTestCase = async () => {
    if (!selectedTestCase) return;

    try {
      const response = await fetch(`http://localhost:8000/api/test-cases/${selectedTestCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestCase)
      });

        if (response.ok) {
          const updated = await response.json();
          setTestCases(testCases.map(tc => tc.id === selectedTestCase.id ? updated : tc));
          setSelectedTestCase(updated);
          setIsEditing(false);
          setEditingTestCase({});
          
          // Принудительно обновляем данные
          setTimeout(() => {
            fetchTestCases();
            fetchFolders();
          }, 100);
        }
    } catch (error) {
      console.error('Error updating test case:', error);
    }
  };

  const handleDeleteTestCase = async () => {
    if (!selectedTestCase) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этот тест-кейс?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/test-cases/${selectedTestCase.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setTestCases(testCases.filter(tc => tc.id !== selectedTestCase.id));
          setSelectedTestCase(null);
        }
      } catch (error) {
        console.error('Error deleting test case:', error);
      }
    }
  };

  const handleCloneTestCase = async () => {
    if (!selectedTestCase) return;

    try {
      const response = await fetch(`http://localhost:8000/api/test-cases/${selectedTestCase.id}/clone`, {
        method: 'POST'
      });

      if (response.ok) {
        const cloned = await response.json();
        setTestCases([...testCases, cloned]);
        setSelectedTestCase(cloned);
      }
    } catch (error) {
      console.error('Error cloning test case:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName?.trim()) return;

    try {
      const folderData = {
        name: newFolderName,
        parent_id: selectedParentFolder || null
      };

      const response = await fetch('http://localhost:8000/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });

      if (response.ok) {
        const created = await response.json();
        setFolders([...folders, created]);
        setNewFolderName('');
        setSelectedParentFolder('');
        setShowFolderModal(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Проверяем, есть ли дочерние папки
    const childFolders = getChildFolders(folderId);
    const hasChildren = childFolders.length > 0;
    
    const confirmMessage = hasChildren 
      ? `Вы уверены, что хотите удалить папку "${folder.name}" и все её подпапки? Все тест-кейсы будут перемещены в корень.`
      : `Вы уверены, что хотите удалить папку "${folder.name}"? Все тест-кейсы в ней будут перемещены в корень.`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`http://localhost:8000/api/folders/${folderId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Удаляем папку и все её дочерние папки из списка
          const foldersToDelete = [folderId, ...childFolders.map(cf => cf.id)];
          setFolders(folders.filter(f => !foldersToDelete.includes(f.id)));
          
          // Перемещаем тест-кейсы из удаленных папок в корень
          setTestCases(testCases.map(tc => 
            foldersToDelete.includes(tc.folder_id || '') ? { ...tc, folder_id: undefined } : tc
          ));
          
          // Убираем все удаленные папки из открытых
          const newExpanded = new Set(expandedFolders);
          foldersToDelete.forEach(id => newExpanded.delete(id));
          setExpandedFolders(newExpanded);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const startEditing = () => {
    const editingData = selectedTestCase ? {
      ...selectedTestCase,
      folder_id: selectedTestCase.folder_id === null ? undefined : selectedTestCase.folder_id
    } : {};
    
    setEditingTestCase(editingData);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTestCase({});
  };

  const addStep = () => {
    setEditingTestCase({
      ...editingTestCase,
      steps: [...(editingTestCase.steps || []), { step: '', expected_res: '' }]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = [...(editingTestCase.steps || [])];
    newSteps.splice(index, 1);
    setEditingTestCase({ ...editingTestCase, steps: newSteps });
  };

  const updateStep = (index: number, field: 'step' | 'expected_res', value: string) => {
    const newSteps = [...(editingTestCase.steps || [])];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditingTestCase({ ...editingTestCase, steps: newSteps });
  };

  const addTag = () => {
    const tag = prompt('Введите тег:');
    if (tag) {
      setEditingTestCase({
        ...editingTestCase,
        tags: [...(editingTestCase.tags || []), tag]
      });
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...(editingTestCase.tags || [])];
    newTags.splice(index, 1);
    setEditingTestCase({ ...editingTestCase, tags: newTags });
  };

  // Функции для работы с деревом
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getTestCasesInFolder = (folderId: string) => {
    const folderTestCases = testCases.filter(tc => tc.folder_id === folderId);
    return applyFilters(folderTestCases);
  };

  const getTestCasesWithoutFolder = () => {
    const rootTestCases = testCases.filter(tc => !tc.folder_id || tc.folder_id === null);
    return applyFilters(rootTestCases);
  };

  const applyFilters = (testCasesList: TestCase[]) => {
    return testCasesList.filter(testCase => {
      // Фильтр по поиску
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          testCase.title.toLowerCase().includes(query) ||
          testCase.author.toLowerCase().includes(query) ||
          testCase.description?.toLowerCase().includes(query) ||
          testCase.tags.some(tag => tag.toLowerCase().includes(query))
        );
        if (!matchesSearch) {
          return false;
        }
      }
      
          // Фильтр по автору
          if (filters.author && testCase.author !== filters.author) {
            return false;
          }
          
          // Фильтр по статусу
          if (filters.status && testCase.status !== filters.status) {
            return false;
          }
      
      // Фильтр по тегам
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          testCase.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getRootFolders = () => {
    return folders.filter(f => !f.parent_id);
  };

  const getChildFolders = (parentId: string) => {
    return folders.filter(f => f.parent_id === parentId);
  };

  // Drag and Drop обработчик
  const handleDragEnd = async (result: any) => {
    console.log('Drag end result:', result);
    
    if (!result.destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    const { source, destination, draggableId } = result;
    
    console.log('Drag details:', { source, destination, draggableId });
    
    // Если перетаскиваем тест-кейс
    if (draggableId.startsWith('testcase-')) {
      const testCaseId = draggableId.replace('testcase-', '');
      const targetFolderId = destination.droppableId === 'root' ? undefined : destination.droppableId;
      
      console.log('Moving test case:', { testCaseId, targetFolderId, source, destination });
      
      // Проверяем, действительно ли изменилась папка
      const currentTestCase = testCases.find(tc => tc.id === testCaseId);
      console.log('Current test case:', currentTestCase);
      console.log('Current folder_id:', currentTestCase?.folder_id);
      console.log('Target folder_id:', targetFolderId);
      
      // Нормализуем значения для сравнения
      const currentFolderId = currentTestCase?.folder_id || null;
      const normalizedTargetFolderId = targetFolderId || null;
      
      if (currentFolderId === normalizedTargetFolderId) {
        console.log('Folder not changed, skipping update');
        return; // Папка не изменилась, ничего не делаем
      }
      
      try {
        const response = await fetch(`http://localhost:8000/api/test-cases/${testCaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_id: targetFolderId })
        });

        if (response.ok) {
          const updated = await response.json();
          console.log('Test case updated:', updated);
          setTestCases(testCases.map(tc => tc.id === testCaseId ? updated : tc));
          
          // Принудительно обновляем данные
          setTimeout(() => {
            fetchTestCases();
            fetchFolders();
          }, 100);
        } else {
          console.error('Failed to update test case:', response.status);
        }
      } catch (error) {
        console.error('Error moving test case:', error);
      }
    }
  };

  if (loading) {
    return (
      <Theme preset={presetGpnDefault}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text>Загрузка...</Text>
        </div>
      </Theme>
    );
  }

  return (
    <Theme preset={presetGpnDefault}>
      <Layout direction="column" style={{ height: '100vh' }}>
        {/* Header */}
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #e1e5e9', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              size="s" 
              view="ghost" 
              iconLeft={sidebarVisible ? IconClose : IconHamburger}
              onClick={() => setSidebarVisible(!sidebarVisible)}
              style={{ marginRight: '8px' }}
            />
            <IconCheck size="m" style={{ color: '#1890ff' }} />
            <Text size="l" weight="bold">DSTestCaseViewer</Text>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="s" view="ghost" iconLeft={IconFolderClosed} onClick={() => setShowFolderModal(true)}>
              Создать папку
            </Button>
            <Button size="s" view="ghost" iconLeft={IconAdd} onClick={() => {
              setNewTestCase({});
              setShowCreateModal(true);
            }}>
              Создать тест-кейс
            </Button>
            <Button size="s" view="ghost" iconLeft={IconDownload} onClick={handleExport}>
              Экспорт
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Layout direction="row" style={{ flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          {sidebarVisible && (
            <Layout direction="column" style={{ width: '300px', borderRight: '1px solid #e1e5e9', padding: '16px', overflow: 'hidden' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text size="l" weight="bold">
                Тест-кейсы ({hasActiveFilters() || searchQuery ? 
                  getFilteredTestCases().length : 
                  testCases.length
                })
              </Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Панель фильтров */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <Text size="m" weight="bold">Фильтры</Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="xs"
                    view="ghost"
                    iconLeft={showFilters ? IconClose : IconFilter}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ 
                      backgroundColor: showFilters ? '#e3f2fd' : 'transparent',
                      color: showFilters ? '#1976d2' : '#666'
                    }}
                  >
                    {showFilters ? 'Скрыть' : 'Показать'}
                  </Button>
                  {hasActiveFilters() && (
                    <Button
                      size="xs"
                      view="ghost"
                      iconLeft={IconClose}
                      onClick={clearFilters}
                      style={{ color: '#dc2626' }}
                    >
                      Очистить
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Фильтр по автору */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text size="s" weight="bold" style={{ marginBottom: '8px', color: '#374151' }}>
                      Автор
                    </Text>
                    <Select
                      key={`author-${filters.author || 'empty'}`}
                      size="s"
                      placeholder="Выберите автора"
                      value={filters.author ? { label: filters.author, value: filters.author } : undefined}
                      onChange={({ value }) => handleFilterChange('author', value?.value || value || '')}
                      items={getAllAuthors().map(author => ({ label: author, value: author }))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Фильтр по статусу */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text size="s" weight="bold" style={{ marginBottom: '8px', color: '#374151' }}>
                      Статус
                    </Text>
                    <Select
                      key={`status-${filters.status || 'empty'}`}
                      size="s"
                      placeholder="Выберите статус"
                      value={filters.status ? statusOptions.find(s => s.value === filters.status) : undefined}
                      onChange={({ value }) => handleFilterChange('status', value?.value || value || '')}
                      items={statusOptions}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Фильтр по тегам */}
                  <div>
                    <Text size="s" weight="bold" style={{ marginBottom: '8px', color: '#374151' }}>
                      Теги
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getAllTags().map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const newTags = filters.tags.includes(tag)
                              ? filters.tags.filter(t => t !== tag)
                              : [...filters.tags, tag];
                            handleFilterChange('tags', newTags);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '16px',
                            backgroundColor: filters.tags.includes(tag) ? '#22c55e' : '#ffffff',
                            color: filters.tags.includes(tag) ? 'white' : '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <DragDropContext onDragEnd={handleDragEnd}>
                {/* Отображение результатов поиска/фильтров или дерева папок и тест-кейсов */}
                {searchQuery || hasActiveFilters() ? (
                  <div>
                    {/* Результаты поиска/фильтров - показываем все элементы без вложенности */}
                    <div style={{ marginBottom: '16px' }}>
                      <Text size="s" weight="bold" style={{ color: '#666' }}>
                        {searchQuery ? `Результаты поиска для "${searchQuery}"` : 'Результаты фильтрации'}
                      </Text>
                    </div>
                    
                    {/* Найденные папки (только при поиске) */}
                    {searchQuery && getSearchResults()?.folders.map(folder => (
                      <div
                        key={folder.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }}
                        onClick={() => setSelectedTestCase(null)}
                      >
                        <IconFolderClosed size="s" style={{ marginRight: '8px' }} />
                        <Text size="s" weight="bold">{folder.name}</Text>
                      </div>
                    ))}
                    
                    {/* Найденные/отфильтрованные тест-кейсы */}
                    {(searchQuery ? getSearchResults()?.testCases : getFilteredTestCases()).map(testCase => (
                      <div
                        key={testCase.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px',
                          cursor: 'pointer',
                          backgroundColor: selectedTestCase?.id === testCase.id ? '#e1f5fe' : '#fff',
                          borderRadius: '4px',
                          marginBottom: '2px',
                          border: '1px solid #e1e5e9'
                        }}
                        onClick={() => setSelectedTestCase(testCase)}
                      >
                        <IconDocFilled size="s" style={{ marginRight: '8px' }} />
                        <div style={{ flex: 1 }}>
                          <Text size="s" weight="bold">{testCase.title}</Text>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Автор: {testCase.author}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {((searchQuery ? getSearchResults()?.testCases : getFilteredTestCases()).length === 0 && 
                      (!searchQuery || getSearchResults()?.folders.length === 0)) && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        <Text size="s">
                          {searchQuery ? 'Ничего не найдено' : 'Нет тест-кейсов, соответствующих фильтрам'}
                        </Text>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Обычное отображение дерева */
                  getRootFolders().map(folder => (
                <div key={folder.id}>
                  {/* Папка */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}
                  >
                    <div 
                      style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <IconFolderOpen size="s" style={{ marginRight: '8px' }} />
                      ) : (
                        <IconFolderClosed size="s" style={{ marginRight: '8px' }} />
                      )}
                      <Text size="s" weight="bold">{folder.name}</Text>
                    </div>
                    <Button
                      size="xs"
                      view="ghost"
                      iconLeft={IconTrash}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      style={{ marginLeft: '8px' }}
                    >
                      Удалить
                    </Button>
                  </div>

                  {/* Содержимое папки */}
                  {expandedFolders.has(folder.id) && (
                    <Droppable droppableId={folder.id}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{ 
                            marginLeft: '20px', 
                            marginBottom: '8px',
                            backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : 'transparent',
                            borderRadius: '4px',
                            padding: '4px'
                          }}
                        >
                      {/* Подпапки */}
                      {getChildFolders(folder.id).map(childFolder => (
                        <div key={childFolder.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px',
                              backgroundColor: '#f9f9f9',
                              borderRadius: '4px',
                              marginBottom: '4px'
                            }}
                          >
                            <div 
                              style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                              onClick={() => toggleFolder(childFolder.id)}
                            >
                              {expandedFolders.has(childFolder.id) ? (
                                <IconFolderOpen size="xs" style={{ marginRight: '6px' }} />
                              ) : (
                                <IconFolderClosed size="xs" style={{ marginRight: '6px' }} />
                              )}
                              <Text size="xs" weight="bold">{childFolder.name}</Text>
                            </div>
                            <Button
                              size="xs"
                              view="ghost"
                              iconLeft={IconTrash}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(childFolder.id);
                              }}
                              style={{ marginLeft: '8px' }}
                            >
                              Удалить
                            </Button>
                          </div>

                          {/* Тест-кейсы в подпапке */}
                          {expandedFolders.has(childFolder.id) && (
                            <div style={{ marginLeft: '16px' }}>
                              {getTestCasesInFolder(childFolder.id).length > 0 ? (
                                getTestCasesInFolder(childFolder.id)
                                  .map(testCase => (
                                  <div
                                    key={testCase.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '6px',
                                      cursor: 'pointer',
                                      backgroundColor: selectedTestCase?.id === testCase.id ? '#e1f5fe' : '#fff',
                                      borderRadius: '4px',
                                      marginBottom: '2px',
                                      border: '1px solid #e1e5e9'
                                    }}
                                    onClick={() => setSelectedTestCase(testCase)}
                                  >
                                    <IconDocFilled size="xs" style={{ marginRight: '6px' }} />
                                    <div>
                                      <Text size="xs" weight="bold">{testCase.title}</Text>
                                      <div style={{ marginTop: '2px' }}>
                                        <Text size="xs" view="secondary">Автор: {testCase.author}</Text>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div 
                                  style={{
                                    marginLeft: '16px',
                                    padding: '12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    border: '1px dashed #cbd5e1',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    ':hover': {
                                      backgroundColor: '#e2e8f0',
                                      borderColor: '#94a3b8'
                                    }
                                  }}
                                  onClick={() => {
                                    setNewTestCase({ folder_id: childFolder.id });
                                    setShowCreateModal(true);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                                    e.currentTarget.style.borderColor = '#94a3b8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                  }}
                                >
                                  <Text size="xs" style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                                    📄 Тест-кейсов в этой папке нет
                                  </Text>
                                  <Text size="xs" style={{ color: '#3b82f6', fontWeight: '500' }}>
                                    + Создать тест-кейс
                                  </Text>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Тест-кейсы в корневой папке */}
                      {getTestCasesInFolder(folder.id).length > 0 ? (
                        getTestCasesInFolder(folder.id)
                          .map((testCase, index) => (
                          <Draggable key={testCase.id} draggableId={`testcase-${testCase.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '6px',
                                  cursor: 'pointer',
                                  backgroundColor: selectedTestCase?.id === testCase.id ? '#e1f5fe' : '#fff',
                                  borderRadius: '4px',
                                  marginBottom: '2px',
                                  border: '1px solid #e1e5e9',
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1
                                }}
                                onClick={() => setSelectedTestCase(testCase)}
                              >
                                <IconDocFilled size="xs" style={{ marginRight: '6px' }} />
                                <div>
                                  <Text size="xs" weight="bold">{testCase.title}</Text>
                                  <div style={{ marginTop: '2px' }}>
                                    <Text size="xs" view="secondary">Автор: {testCase.author}</Text>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <div 
                          style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px dashed #cbd5e1',
                            textAlign: 'center',
                            marginTop: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setNewTestCase({ folder_id: folder.id });
                            setShowCreateModal(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e2e8f0';
                            e.currentTarget.style.borderColor = '#94a3b8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                        >
                          <Text size="xs" style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                            📄 Тест-кейсов в этой папке нет
                          </Text>
                          <Text size="xs" style={{ color: '#3b82f6', fontWeight: '500' }}>
                            + Создать тест-кейс
                          </Text>
                        </div>
                      )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              ))
                )}

              {!searchQuery && (
                /* Тест-кейсы без папки */
              <Droppable droppableId="root">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : 'transparent',
                      borderRadius: '4px',
                      padding: '4px'
                    }}
                  >
                    {getTestCasesWithoutFolder()
                      .map((testCase, index) => (
                      <Draggable key={testCase.id} draggableId={`testcase-${testCase.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              cursor: 'pointer',
                              backgroundColor: selectedTestCase?.id === testCase.id ? '#e1f5fe' : '#fff',
                              borderRadius: '4px',
                              marginBottom: '4px',
                              border: '1px solid #e1e5e9',
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                            onClick={() => setSelectedTestCase(testCase)}
                          >
                            <IconDocFilled size="s" style={{ marginRight: '8px' }} />
                            <div>
                              <Text size="s" weight="bold">{testCase.title}</Text>
                              <div style={{ marginTop: '4px' }}>
                                <Text size="xs" view="secondary">Автор: {testCase.author}</Text>
                              </div>
                              <div>
                                <Text size="xs" view="secondary">Статус: {testCase.status}</Text>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              )}
              </DragDropContext>
            </div>
          </Layout>
          )}
          
          {/* Content Area */}
          <Layout direction="column" style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            {selectedTestCase ? (
              <div>
                {/* Header with actions */}
                <div style={{ 
                  marginBottom: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start' 
                }}>
                  <div>
                    <Text size="xl" weight="bold">{selectedTestCase.title}</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text size="s" view="secondary">ID: {selectedTestCase.id}</Text>
                      <br />
                      <Text size="s" view="secondary">Автор: {selectedTestCase.author}</Text>
                      <br />
                      <Text size="s" view="secondary">Статус: {selectedTestCase.status}</Text>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isEditing ? (
                      <>
                        <Button size="s" view="primary" iconLeft={IconEdit} onClick={startEditing}>
                          Редактировать
                        </Button>
                        <Button size="s" view="secondary" iconLeft={IconCopy} onClick={handleCloneTestCase}>
                          Клонировать
                        </Button>
                        <Button size="s" view="ghost" iconLeft={IconTrash} onClick={handleDeleteTestCase}>
                          Удалить
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="s" view="primary" iconLeft={IconSave} onClick={handleUpdateTestCase}>
                          Сохранить
                        </Button>
                        <Button size="s" view="ghost" iconLeft={IconCancel} onClick={cancelEditing}>
                          Отмена
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '10px' }}>
                    {/* Edit Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <TextField
                        label="Название"
                        value={editingTestCase.title || ''}
                        onChange={({ value }) => setEditingTestCase({ ...editingTestCase, title: value })}
                        size="s"
                      />
                      <TextField
                        label="Автор"
                        value={editingTestCase.author || ''}
                        onChange={({ value }) => setEditingTestCase({ ...editingTestCase, author: value })}
                        size="s"
                      />
                    </div>
                    
                        <div style={{ marginBottom: '16px' }}>
                          <Select
                            label="Статус"
                            items={statusOptions}
                            value={statusOptions.find(s => s.value === editingTestCase.status)}
                            onChange={({ value }) => setEditingTestCase({ ...editingTestCase, status: value?.value || 'draft' })}
                            size="s"
                          />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <Select
                            label="Папка"
                            items={[
                              { label: 'Без папки', value: '' },
                              ...folders.map(f => {
                                // Если есть родительская папка, показываем полный путь
                                if (f.parent_id) {
                                  const parentFolder = folders.find(pf => pf.id === f.parent_id);
                                  const label = parentFolder ? `${parentFolder.name}/${f.name}` : f.name;
                                  return { label, value: f.id };
                                }
                                return { label: f.name, value: f.id };
                              })
                            ]}
                            value={(() => {
                              // Если нет folder_id или он null/undefined
                              if (!editingTestCase.folder_id || editingTestCase.folder_id === null) {
                                return { label: 'Без папки', value: '' };
                              }
                              
                              // Ищем папку по ID
                              const folder = folders.find(f => f.id === editingTestCase.folder_id);
                              if (folder) {
                                // Если есть родительская папка, показываем полный путь
                                if (folder.parent_id) {
                                  const parentFolder = folders.find(pf => pf.id === folder.parent_id);
                                  const label = parentFolder ? `${parentFolder.name}/${folder.name}` : folder.name;
                                  return { label, value: folder.id };
                                }
                                return { label: folder.name, value: folder.id };
                              }
                              
                              return { label: 'Без папки', value: '' };
                            })()}
                            onChange={({ value }) => {
                              // value может быть строкой или объектом
                              const newFolderId = (typeof value === 'string' ? value : value?.value) === '' ? undefined : (typeof value === 'string' ? value : value?.value);
                              
                              setEditingTestCase({ 
                                ...editingTestCase, 
                                folder_id: newFolderId
                              });
                            }}
                            size="s"
                          />
                        </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text size="s" weight="bold">Описание</Text>
                      </div>
                      <textarea
                        value={editingTestCase.description || ''}
                        onChange={(e) => setEditingTestCase({ ...editingTestCase, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e1e5e9',
                          borderRadius: '4px',
                          minHeight: '80px',
                          resize: 'vertical'
                        }}
                        placeholder="Введите описание тест-кейса"
                      />
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text size="s" weight="bold">Предусловия</Text>
                      </div>
                      <textarea
                        value={editingTestCase.precondition || ''}
                        onChange={(e) => setEditingTestCase({ ...editingTestCase, precondition: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e1e5e9',
                          borderRadius: '4px',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                        placeholder="Введите предусловия"
                      />
                    </div>

                    {/* Tags */}
                    <div style={{ 
                      marginBottom: '24px',
                      padding: '20px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #22c55e'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#22c55e',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#22c55e' }}>Теги</Text>
                        </div>
                        <Button 
                          size="s" 
                          view="primary" 
                          iconLeft={IconAdd} 
                          onClick={addTag}
                          style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                        >
                          Добавить тег
                        </Button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(editingTestCase.tags || []).map((tag, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                              gap: '8px'
                            }}
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => removeTag(index)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '2px 6px',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Удалить тег"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div style={{ 
                      marginBottom: '24px',
                      padding: '20px',
                      backgroundColor: '#fefce8',
                      border: '1px solid #fde047',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #eab308'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#eab308',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#eab308' }}>Шаги тестирования</Text>
                        </div>
                        <Button 
                          size="s" 
                          view="primary" 
                          iconLeft={IconAdd} 
                          onClick={addStep}
                          style={{ backgroundColor: '#eab308', borderColor: '#eab308' }}
                        >
                          Добавить шаг
                        </Button>
                      </div>
                      
                      {(editingTestCase.steps || []).map((step, index) => (
                        <div key={index} style={{ 
                          marginBottom: '16px', 
                          padding: '16px', 
                          backgroundColor: '#ffffff', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '12px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#eab308',
                                color: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginRight: '12px'
                              }}>
                                {index + 1}
                              </div>
                              <Text size="m" weight="bold" style={{ color: '#374151' }}>Шаг {index + 1}</Text>
                            </div>
                            <Button 
                              size="s" 
                              view="ghost" 
                              iconLeft={IconTrash} 
                              onClick={() => removeStep(index)}
                              style={{ color: '#dc2626' }}
                            >
                              Удалить
                            </Button>
                          </div>
                          
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280' }}>Действие:</Text>
                            </div>
                            <textarea
                              value={step.step}
                              onChange={(e) => updateStep(index, 'step', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                minHeight: '80px',
                                resize: 'vertical',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                backgroundColor: '#f9fafb',
                                transition: 'border-color 0.2s ease'
                              }}
                              placeholder="Опишите шаг"
                            />
                          </div>
                          
                          <div>
                            <div style={{ marginBottom: '8px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280' }}>Ожидаемый результат:</Text>
                            </div>
                            <textarea
                              value={step.expected_res}
                              onChange={(e) => updateStep(index, 'expected_res', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                minHeight: '80px',
                                resize: 'vertical',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                backgroundColor: '#f9fafb',
                                transition: 'border-color 0.2s ease'
                              }}
                              placeholder="Опишите ожидаемый результат"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Labels Block in Edit Mode */}
                    <Card style={{ 
                      marginBottom: '20px', 
                      padding: '20px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #f59e0b'
                      }}>
                        <div style={{
                          width: '4px',
                          height: '20px',
                          backgroundColor: '#f59e0b',
                          marginRight: '12px',
                          borderRadius: '2px'
                        }}></div>
                        <Text size="l" weight="bold" style={{ color: '#f59e0b' }}>Labels</Text>
                      </div>
                      
                      <div style={{ marginTop: '16px' }}>
                        {/* Epic */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Epic *
                          </label>
                          <input
                            type="text"
                            value={editingTestCase.labels?.find(l => l.name === 'epic')?.value || ''}
                            onChange={(e) => {
                              const newLabels = [...(editingTestCase.labels || [])];
                              const epicIndex = newLabels.findIndex(l => l.name === 'epic');
                              if (epicIndex >= 0) {
                                newLabels[epicIndex].value = e.target.value;
                              } else {
                                newLabels.push({ name: 'epic', value: e.target.value });
                              }
                              setEditingTestCase({ ...editingTestCase, labels: newLabels });
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            placeholder="Введите epic"
                          />
                        </div>

                        {/* Feature */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Feature *
                          </label>
                          <input
                            type="text"
                            value={editingTestCase.labels?.find(l => l.name === 'feature')?.value || ''}
                            onChange={(e) => {
                              const newLabels = [...(editingTestCase.labels || [])];
                              const featureIndex = newLabels.findIndex(l => l.name === 'feature');
                              if (featureIndex >= 0) {
                                newLabels[featureIndex].value = e.target.value;
                              } else {
                                newLabels.push({ name: 'feature', value: e.target.value });
                              }
                              setEditingTestCase({ ...editingTestCase, labels: newLabels });
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            placeholder="Введите feature"
                          />
                        </div>

                        {/* Story */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Story *
                          </label>
                          <input
                            type="text"
                            value={editingTestCase.labels?.find(l => l.name === 'story')?.value || ''}
                            onChange={(e) => {
                              const newLabels = [...(editingTestCase.labels || [])];
                              const storyIndex = newLabels.findIndex(l => l.name === 'story');
                              if (storyIndex >= 0) {
                                newLabels[storyIndex].value = e.target.value;
                              } else {
                                newLabels.push({ name: 'story', value: e.target.value });
                              }
                              setEditingTestCase({ ...editingTestCase, labels: newLabels });
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            placeholder="Введите story"
                          />
                        </div>

                        {/* Custom Labels */}
                        <div style={{ marginTop: '16px' }}>
                          <Text size="m" weight="bold" style={{ marginBottom: '8px', color: '#374151' }}>
                            Дополнительные поля
                          </Text>
                          {(editingTestCase.labels || [])
                            .filter(l => !['epic', 'feature', 'story'].includes(l.name))
                            .map((label, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginBottom: '8px',
                                alignItems: 'center'
                              }}>
                                <input
                                  type="text"
                                  value={label.name}
                                  onChange={(e) => {
                                    const newLabels = [...(editingTestCase.labels || [])];
                                    const labelIndex = newLabels.findIndex(l => l === label);
                                    if (labelIndex >= 0) {
                                      newLabels[labelIndex].name = e.target.value;
                                      setEditingTestCase({ ...editingTestCase, labels: newLabels });
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none'
                                  }}
                                  placeholder="Ключ"
                                />
                                <input
                                  type="text"
                                  value={label.value}
                                  onChange={(e) => {
                                    const newLabels = [...(editingTestCase.labels || [])];
                                    const labelIndex = newLabels.findIndex(l => l === label);
                                    if (labelIndex >= 0) {
                                      newLabels[labelIndex].value = e.target.value;
                                      setEditingTestCase({ ...editingTestCase, labels: newLabels });
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none'
                                  }}
                                  placeholder="Значение"
                                />
                                <button
                                  onClick={() => {
                                    const newLabels = (editingTestCase.labels || []).filter(l => l !== label);
                                    setEditingTestCase({ ...editingTestCase, labels: newLabels });
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          
                          <button
                            onClick={() => {
                              const newLabels = [...(editingTestCase.labels || []), { name: '', value: '' }];
                              setEditingTestCase({ ...editingTestCase, labels: newLabels });
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              marginTop: '8px'
                            }}
                          >
                            + Добавить поле
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '10px' }}>
                    {/* View Mode */}
                    {selectedTestCase.description && (
                      <Card style={{ 
                        marginBottom: '20px', 
                        padding: '20px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #1e40af'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#1e40af',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#1e40af' }}>Описание</Text>
                        </div>
                        <Text style={{ color: '#374151', lineHeight: '1.6' }}>{selectedTestCase.description}</Text>
                      </Card>
                    )}

                    {selectedTestCase.precondition && (
                      <Card style={{ 
                        marginBottom: '20px', 
                        padding: '20px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #0ea5e9'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#0ea5e9',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#0ea5e9' }}>Предусловия</Text>
                        </div>
                        <Text style={{ color: '#374151', lineHeight: '1.6' }}>{selectedTestCase.precondition}</Text>
                      </Card>
                    )}

                    {selectedTestCase.steps && selectedTestCase.steps.length > 0 && (
                      <Card style={{ 
                        marginBottom: '20px', 
                        padding: '20px',
                        backgroundColor: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '16px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #eab308'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#eab308',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#eab308' }}>Шаги тестирования</Text>
                        </div>
                        {selectedTestCase.steps.map((step, index) => (
                          <div key={index} style={{ 
                            marginBottom: '16px', 
                            padding: '16px', 
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#eab308',
                                color: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginRight: '12px'
                              }}>
                                {index + 1}
                              </div>
                              <Text size="m" weight="bold" style={{ color: '#374151' }}>Шаг {index + 1}</Text>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280', marginBottom: '4px' }}>Действие:</Text>
                              <Text style={{ color: '#374151', lineHeight: '1.6' }}>{step.step}</Text>
                            </div>
                            <div>
                              <Text size="s" weight="bold" style={{ color: '#6b7280', marginBottom: '4px' }}>Ожидаемый результат:</Text>
                              <Text style={{ color: '#374151', lineHeight: '1.6' }}>{step.expected_res}</Text>
                            </div>
                          </div>
                        ))}
                      </Card>
                    )}

                    {selectedTestCase.tags && selectedTestCase.tags.length > 0 && (
                      <Card style={{ 
                        marginBottom: '20px', 
                        padding: '20px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #22c55e'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#22c55e',
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <Text size="l" weight="bold" style={{ color: '#22c55e' }}>Теги</Text>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {selectedTestCase.tags.map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: '#22c55e',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Labels Block - View Mode */}
                    <Card style={{ 
                      marginBottom: '20px', 
                      padding: '20px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: labelsExpanded ? '12px' : '0',
                          paddingBottom: labelsExpanded ? '8px' : '0',
                          borderBottom: labelsExpanded ? '2px solid #f59e0b' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => setLabelsExpanded(!labelsExpanded)}
                      >
                        <div style={{
                          width: '4px',
                          height: '20px',
                          backgroundColor: '#f59e0b',
                          marginRight: '12px',
                          borderRadius: '2px'
                        }}></div>
                        <Text size="l" weight="bold" style={{ color: '#f59e0b' }}>Labels</Text>
                        <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                          {labelsExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                      
                      {labelsExpanded && (
                        <div style={{ marginTop: '16px' }}>
                          {/* Epic */}
                          {selectedTestCase.labels?.find(l => l.name === 'epic')?.value && (
                            <div style={{ marginBottom: '12px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280', marginBottom: '4px' }}>Epic:</Text>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '14px',
                                color: '#374151'
                              }}>
                                {selectedTestCase.labels.find(l => l.name === 'epic')?.value}
                              </div>
                            </div>
                          )}

                          {/* Feature */}
                          {selectedTestCase.labels?.find(l => l.name === 'feature')?.value && (
                            <div style={{ marginBottom: '12px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280', marginBottom: '4px' }}>Feature:</Text>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '14px',
                                color: '#374151'
                              }}>
                                {selectedTestCase.labels.find(l => l.name === 'feature')?.value}
                              </div>
                            </div>
                          )}

                          {/* Story */}
                          {selectedTestCase.labels?.find(l => l.name === 'story')?.value && (
                            <div style={{ marginBottom: '12px' }}>
                              <Text size="s" weight="bold" style={{ color: '#6b7280', marginBottom: '4px' }}>Story:</Text>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '14px',
                                color: '#374151'
                              }}>
                                {selectedTestCase.labels.find(l => l.name === 'story')?.value}
                              </div>
                            </div>
                          )}

                          {/* Custom Labels */}
                          {(selectedTestCase.labels || [])
                            .filter(l => !['epic', 'feature', 'story'].includes(l.name))
                            .length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <Text size="m" weight="bold" style={{ marginBottom: '8px', color: '#374151' }}>
                                Дополнительные поля
                              </Text>
                              {(selectedTestCase.labels || [])
                                .filter(l => !['epic', 'feature', 'story'].includes(l.name))
                                .map((label, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '8px',
                                    padding: '8px 12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <Text size="s" weight="bold" style={{ color: '#6b7280' }}>{label.name}:</Text>
                                        <div style={{ marginTop: '4px', color: '#374151', fontSize: '14px' }}>
                                          {label.value}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Show message if no labels */}
                          {(!selectedTestCase.labels || selectedTestCase.labels.length === 0) && (
                            <div style={{ 
                              textAlign: 'center', 
                              padding: '20px', 
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              <Text size="s">Labels не заданы</Text>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '400px',
                padding: '60px 40px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px dashed #e2e8f0',
                margin: '20px'
              }}>
                {/* Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: '#3b82f6'
                  }}>
                    📋
                  </div>
                </div>

                {/* Title */}
                <Text size="xl" weight="bold" style={{ 
                  color: '#1f2937', 
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  Выберите тест-кейс для просмотра
                </Text>

                {/* Description */}
                <Text size="m" style={{ 
                  color: '#6b7280', 
                  marginBottom: '24px',
                  textAlign: 'center',
                  maxWidth: '400px',
                  lineHeight: '1.5'
                }}>
                  Выберите тест-кейс из списка слева, чтобы просмотреть его детали, 
                  отредактировать или выполнить другие действия
                </Text>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  <Text size="m" weight="medium" style={{ color: '#374151' }}>
                    Всего тест-кейсов: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{testCases.length}</span>
                  </Text>
                </div>

                {/* Additional info */}
                {testCases.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <Text size="s" style={{ color: '#9ca3af' }}>
                      💡 Совет: Используйте поиск или фильтры для быстрого поиска нужного тест-кейса
                    </Text>
                  </div>
                )}
              </div>
            )}
          </Layout>
        </Layout>

        {/* Create Test Case Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div style={{ padding: '20px', width: '500px' }}>
            <Text size="l" weight="bold" style={{ marginBottom: '20px' }}>Создать новый тест-кейс</Text>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Название</label>
              <input
                type="text"
                value={newTestCase.title || ''}
                onChange={(e) => {
                  setNewTestCase({ ...newTestCase, title: e.target.value });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Введите название тест-кейса"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Автор</label>
              <input
                type="text"
                value={newTestCase.author || ''}
                onChange={(e) => {
                  setNewTestCase({ ...newTestCase, author: e.target.value });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Введите имя автора"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Select
                label="Статус"
                items={statusOptions}
                value={statusOptions.find(s => s.value === newTestCase.status)}
                onChange={({ value }) => setNewTestCase({ ...newTestCase, status: value?.value || 'draft' })}
                size="s"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Select
                label="Папка"
                items={[
                  { label: 'Без папки', value: null },
                  ...folders.map(folder => ({
                    label: folder.name,
                    value: folder.id
                  }))
                ]}
                value={newTestCase.folder_id ? 
                  { label: folders.find(f => f.id === newTestCase.folder_id)?.name || 'Неизвестная папка', value: newTestCase.folder_id } : 
                  { label: 'Без папки', value: null }
                }
                onChange={({ value }) => setNewTestCase({ ...newTestCase, folder_id: value?.value || null })}
                size="s"
              />
            </div>
            
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button size="s" view="ghost" iconLeft={IconCancel} onClick={() => {
                    setShowCreateModal(false);
                    setNewTestCase({});
                  }}>
                    Отмена
                  </Button>
                  <Button size="s" view="primary" iconLeft={IconAdd} onClick={handleCreateTestCase}>
                    Создать
                  </Button>
                </div>
          </div>
        </Modal>

        {/* Create Folder Modal */}
        <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)}>
          <div style={{ padding: '20px', width: '400px' }}>
            <Text size="l" weight="bold" style={{ marginBottom: '20px' }}>Создать новую папку</Text>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Text size="s" weight="bold">Название папки</Text>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => {
                  console.log('Folder name value:', e.target.value, 'type:', typeof e.target.value);
                  setNewFolderName(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px'
                }}
                placeholder="Введите название папки"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Select
                label="Родительская папка"
                items={[
                  { label: 'Корневая папка', value: '' },
                  ...folders.map(f => {
                    // Если есть родительская папка, показываем полный путь
                    if (f.parent_id) {
                      const parentFolder = folders.find(pf => pf.id === f.parent_id);
                      const label = parentFolder ? `${parentFolder.name}/${f.name}` : f.name;
                      return { label, value: f.id };
                    }
                    return { label: f.name, value: f.id };
                  })
                ]}
                value={selectedParentFolder ? 
                  folders.find(f => f.id === selectedParentFolder) ? 
                    (() => {
                      const folder = folders.find(f => f.id === selectedParentFolder);
                      if (folder?.parent_id) {
                        const parentFolder = folders.find(pf => pf.id === folder.parent_id);
                        const label = parentFolder ? `${parentFolder.name}/${folder.name}` : folder.name;
                        return { label, value: folder.id };
                      }
                      return { label: folder?.name || '', value: folder?.id || '' };
                    })() : 
                    { label: 'Корневая папка', value: '' }
                  : 
                  { label: 'Корневая папка', value: '' }
                }
                onChange={({ value }) => {
                  setSelectedParentFolder(value || '');
                }}
                size="s"
              />
            </div>
            
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button size="s" view="ghost" iconLeft={IconCancel} onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName('');
                    setSelectedParentFolder('');
                  }}>
                    Отмена
                  </Button>
                  <Button 
                    size="s" 
                    view="primary" 
                    iconLeft={IconFolderOpen} 
                    onClick={handleCreateFolder}
                    disabled={!newFolderName || newFolderName.trim() === ''}
                  >
                    Создать
                  </Button>
                </div>
          </div>
        </Modal>
      </Layout>
    </Theme>
  );
}

export default App;

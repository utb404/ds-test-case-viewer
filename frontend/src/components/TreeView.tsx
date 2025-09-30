import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Text } from '@consta/uikit/Text';
import { Button } from '@consta/uikit/Button';
import { IconFolder, IconFile, IconPlus, IconTrash, IconEdit } from '@consta/icons';
import { TestCase, Folder } from '../services/api';
import { useMutation, useQueryClient } from 'react-query';
import { createFolder, deleteFolder, createTestCase, deleteTestCase } from '../services/api';

interface TreeViewProps {
  folders: Folder[];
  testCases: TestCase[];
  selectedTestCase: TestCase | null;
  selectedFolder: Folder | null;
  onTestCaseSelect: (testCase: TestCase) => void;
  onFolderSelect: (folder: Folder) => void;
  isLoading: boolean;
}

interface TreeNode {
  id: string;
  type: 'folder' | 'testcase';
  name: string;
  data: Folder | TestCase;
  children: TreeNode[];
  parentId?: string;
}

const TreeView: React.FC<TreeViewProps> = ({
  folders,
  testCases,
  selectedTestCase,
  selectedFolder,
  onTestCaseSelect,
  onFolderSelect,
  isLoading
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation(createFolder, {
    onSuccess: () => {
      queryClient.invalidateQueries('folders');
    },
  });

  const deleteFolderMutation = useMutation(deleteFolder, {
    onSuccess: () => {
      queryClient.invalidateQueries('folders');
      queryClient.invalidateQueries('test-cases');
    },
  });

  const createTestCaseMutation = useMutation(createTestCase, {
    onSuccess: () => {
      queryClient.invalidateQueries('test-cases');
    },
  });

  const deleteTestCaseMutation = useMutation(deleteTestCase, {
    onSuccess: () => {
      queryClient.invalidateQueries('test-cases');
    },
  });

  const buildTree = (): TreeNode[] => {
    const folderMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Создаем узлы для папок
    folders.forEach(folder => {
      const node: TreeNode = {
        id: folder.id,
        type: 'folder',
        name: folder.name,
        data: folder,
        children: [],
        parentId: folder.parent_id
      };
      folderMap.set(folder.id, node);
    });

    // Создаем узлы для тест-кейсов
    testCases.forEach(testCase => {
      const node: TreeNode = {
        id: testCase.id,
        type: 'testcase',
        name: testCase.title,
        data: testCase,
        children: [],
        parentId: testCase.folder_id
      };
      folderMap.set(testCase.id, node);
    });

    // Строим иерархию
    folderMap.forEach(node => {
      if (node.parentId && folderMap.has(node.parentId)) {
        const parent = folderMap.get(node.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const tree = buildTree();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCreateFolder = () => {
    const name = prompt('Введите название папки:');
    if (name) {
      createFolderMutation.mutate({ name });
    }
  };

  const handleCreateTestCase = (folderId?: string) => {
    const title = prompt('Введите название тест-кейса:');
    if (title) {
      createTestCaseMutation.mutate({
        title,
        author: 'Новый автор',
        status: 'draft',
        folder_id: folderId,
        tags: [],
        steps: [],
        labels: []
      });
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить папку?')) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить тест-кейс?')) {
      deleteTestCaseMutation.mutate(testCaseId);
    }
  };

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = 
      (node.type === 'testcase' && selectedTestCase?.id === node.id) ||
      (node.type === 'folder' && selectedFolder?.id === node.id);

    return (
      <div key={node.id}>
        <div
          className={`tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              onFolderSelect(node.data as Folder);
            } else {
              onTestCaseSelect(node.data as TestCase);
            }
          }}
        >
          <div className="tree-item-content">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {node.type === 'folder' && (
                <Button
                  size="xs"
                  view="ghost"
                  iconLeft={isExpanded ? IconFolder : IconFolder}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(node.id);
                  }}
                />
              )}
              {node.type === 'testcase' && (
                <IconFile className="tree-item-icon" />
              )}
              <Text size="s" style={{ marginLeft: '8px' }}>
                {node.name}
              </Text>
            </div>
            
            <div className="tree-item-actions">
              {node.type === 'folder' && (
                <>
                  <Button
                    size="xs"
                    view="ghost"
                    iconLeft={IconPlus}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateTestCase(node.id);
                    }}
                  />
                  <Button
                    size="xs"
                    view="ghost"
                    iconLeft={IconEdit}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newName = prompt('Введите новое название папки:', node.name);
                      if (newName && newName !== node.name) {
                        // TODO: Implement folder update
                      }
                    }}
                  />
                  <Button
                    size="xs"
                    view="ghost"
                    iconLeft={IconTrash}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(node.id);
                    }}
                  />
                </>
              )}
              {node.type === 'testcase' && (
                <Button
                  size="xs"
                  view="ghost"
                  iconLeft={IconTrash}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTestCase(node.id);
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="tree-container">
        <div className="loading-spinner">
          <Text>Загрузка...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-container">
      <div style={{ marginBottom: '16px' }}>
        <Button
          size="s"
          view="primary"
          iconLeft={IconPlus}
          onClick={handleCreateFolder}
          style={{ marginRight: '8px' }}
        >
          Создать папку
        </Button>
        <Button
          size="s"
          view="secondary"
          iconLeft={IconPlus}
          onClick={() => handleCreateTestCase()}
        >
          Создать тест-кейс
        </Button>
      </div>
      
      <div>
        {tree.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
};

export default TreeView;

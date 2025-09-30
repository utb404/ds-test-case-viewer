import React, { useState } from 'react';
import { Layout } from '@consta/uikit/Layout';
import { Text } from '@consta/uikit/Text';
import { Button } from '@consta/uikit/Button';
import { Card } from '@consta/uikit/Card';
import { useQuery } from 'react-query';
import { getTestCases, getFolders, TestCase, Folder } from '../services/api';

const TestCaseViewer: React.FC = () => {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: testCases = [], isLoading: testCasesLoading } = useQuery(
    'test-cases',
    () => getTestCases(0, 1000)
  );

  const { data: folders = [], isLoading: foldersLoading } = useQuery(
    'folders',
    getFolders
  );

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

  if (testCasesLoading || foldersLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text>Загрузка...</Text>
      </div>
    );
  }

  return (
    <Layout direction="row" style={{ height: '100vh' }}>
      <Layout direction="column" style={{ width: '300px', borderRight: '1px solid #e1e5e9', padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Text size="l" weight="bold">Тест-кейсы</Text>
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

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredTestCases.map(testCase => (
            <Card
              key={testCase.id}
              style={{
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: selectedTestCase?.id === testCase.id ? '#e1f5fe' : '#fff'
              }}
              onClick={() => setSelectedTestCase(testCase)}
            >
              <div style={{ padding: '12px' }}>
                <Text size="s" weight="bold">{testCase.title}</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text size="xs" view="secondary">Автор: {testCase.author}</Text>
                </div>
                <div>
                  <Text size="xs" view="secondary">Статус: {testCase.status}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Layout>
      
      <Layout direction="column" style={{ flex: 1, padding: '20px' }}>
        {selectedTestCase ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Text size="xl" weight="bold">{selectedTestCase.title}</Text>
              <div style={{ marginTop: '8px' }}>
                <Text size="s" view="secondary">ID: {selectedTestCase.id}</Text>
                <br />
                <Text size="s" view="secondary">Автор: {selectedTestCase.author}</Text>
                <br />
                <Text size="s" view="secondary">Статус: {selectedTestCase.status}</Text>
              </div>
            </div>

            {selectedTestCase.description && (
              <Card style={{ marginBottom: '16px', padding: '16px' }}>
                <Text size="m" weight="bold" style={{ marginBottom: '8px' }}>Описание</Text>
                <Text>{selectedTestCase.description}</Text>
              </Card>
            )}

            {selectedTestCase.precondition && (
              <Card style={{ marginBottom: '16px', padding: '16px' }}>
                <Text size="m" weight="bold" style={{ marginBottom: '8px' }}>Предусловия</Text>
                <Text>{selectedTestCase.precondition}</Text>
              </Card>
            )}

            {selectedTestCase.steps && selectedTestCase.steps.length > 0 && (
              <Card style={{ marginBottom: '16px', padding: '16px' }}>
                <Text size="m" weight="bold" style={{ marginBottom: '12px' }}>Шаги тестирования</Text>
                {selectedTestCase.steps.map((step, index) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <Text size="s" weight="bold">Шаг {index + 1}:</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text size="s">{step.step}</Text>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Text size="s" weight="bold">Ожидаемый результат:</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Text size="s">{step.expected_res}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {selectedTestCase.tags && selectedTestCase.tags.length > 0 && (
              <Card style={{ marginBottom: '16px', padding: '16px' }}>
                <Text size="m" weight="bold" style={{ marginBottom: '8px' }}>Теги</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedTestCase.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#e3f2fd',
                        color: '#0277bd',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text size="l">Выберите тест-кейс для просмотра</Text>
            <div style={{ marginTop: '16px' }}>
              <Text view="secondary">Всего тест-кейсов: {testCases.length}</Text>
            </div>
          </div>
        )}
      </Layout>
    </Layout>
  );
};

export default TestCaseViewer;

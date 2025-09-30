import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@consta/uikit/Layout';
import { Text } from '@consta/uikit/Text';
import { Button } from '@consta/uikit/Button';

const MainLayout: React.FC = () => {
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

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          await fetch('http://localhost:8000/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          window.location.reload();
        } catch (error) {
          console.error('Import failed:', error);
        }
      }
    };
    input.click();
  };

  return (
    <Layout direction="column" style={{ height: '100vh' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e1e5e9', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Text size="l" weight="bold">Test Case Viewer</Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="s" view="ghost" onClick={handleExport}>
            Экспорт
          </Button>
          <Button size="s" view="ghost" onClick={handleImport}>
            Импорт
          </Button>
        </div>
      </div>
      <Layout direction="row" style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </Layout>
    </Layout>
  );
};

export default MainLayout;

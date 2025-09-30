import React from 'react';
import { TextField } from '@consta/uikit/TextField';
import { IconSearch } from '@consta/icons/IconSearch';
import { Select } from '@consta/uikit/Select';
import { Button } from '@consta/uikit/Button';
import { IconClose } from '@consta/icons/IconClose';

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ searchQuery, onSearchChange }) => {
  const statusOptions = [
    { label: 'Все статусы', value: '' },
    { label: 'Черновик', value: 'draft' },
    { label: 'Дизайн', value: 'design' },
    { label: 'Готово', value: 'done' },
  ];

  const [statusFilter, setStatusFilter] = React.useState<string>('');

  const handleClearSearch = () => {
    onSearchChange('');
    setStatusFilter('');
  };

  return (
    <div className="search-container">
      <TextField
        placeholder="Поиск по названию, автору, описанию..."
        value={searchQuery}
        onChange={({ value }) => onSearchChange(value || '')}
        leftSide={IconSearch}
        rightSide={
          searchQuery && (
            <Button
              size="xs"
              view="ghost"
              iconLeft={IconClose}
              onClick={handleClearSearch}
            />
          )
        }
        size="s"
        style={{ marginBottom: '12px' }}
      />
      
      <Select
        placeholder="Фильтр по статусу"
        items={statusOptions}
        value={statusFilter}
        onChange={({ value }) => setStatusFilter(value || '')}
        size="s"
      />
    </div>
  );
};

export default SearchPanel;

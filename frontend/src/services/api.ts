import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Типы данных
export interface TestStep {
  step: string;
  expected_res: string;
}

export interface Label {
  name: string;
  value: string;
}

export interface TestCase {
  id: string;
  title: string;
  author: string;
  description?: string;
  precondition?: string;
  status: 'draft' | 'design' | 'done';
  use_case_id?: string;
  folder_id?: string;
  tags: string[];
  steps: TestStep[];
  labels: Label[];
  created_at: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface TestCaseHistory {
  id: string;
  test_case_id: string;
  action: string;
  changes?: any;
  created_at: string;
  user?: string;
}

// API функции для тест-кейсов
export const getTestCases = async (skip = 0, limit = 100): Promise<TestCase[]> => {
  const response = await api.get(`/api/test-cases?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getTestCase = async (id: string): Promise<TestCase> => {
  const response = await api.get(`/api/test-cases/${id}`);
  return response.data;
};

export const createTestCase = async (testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): Promise<TestCase> => {
  const response = await api.post('/api/test-cases', testCase);
  return response.data;
};

export const updateTestCase = async (id: string, testCase: Partial<TestCase>): Promise<TestCase> => {
  const response = await api.put(`/api/test-cases/${id}`, testCase);
  return response.data;
};

export const deleteTestCase = async (id: string): Promise<void> => {
  await api.delete(`/api/test-cases/${id}`);
};

export const cloneTestCase = async (id: string): Promise<TestCase> => {
  const response = await api.post(`/api/test-cases/${id}/clone`);
  return response.data;
};

export const getTestCaseHistory = async (id: string): Promise<TestCaseHistory[]> => {
  const response = await api.get(`/api/test-cases/${id}/history`);
  return response.data;
};

// API функции для папок
export const getFolders = async (): Promise<Folder[]> => {
  const response = await api.get('/api/folders');
  return response.data;
};

export const getFolder = async (id: string): Promise<Folder> => {
  const response = await api.get(`/api/folders/${id}`);
  return response.data;
};

export const createFolder = async (folder: Omit<Folder, 'id' | 'created_at' | 'updated_at'>): Promise<Folder> => {
  const response = await api.post('/api/folders', folder);
  return response.data;
};

export const updateFolder = async (id: string, folder: Partial<Folder>): Promise<Folder> => {
  const response = await api.put(`/api/folders/${id}`, folder);
  return response.data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await api.delete(`/api/folders/${id}`);
};

// API функции для поиска
export const searchTestCases = async (params: {
  query?: string;
  tags?: string;
  status?: string;
  author?: string;
}): Promise<TestCase[]> => {
  const response = await api.get('/api/search', { params });
  return response.data;
};

// API функции для экспорта/импорта
export const exportTestCases = async (): Promise<any> => {
  const response = await api.get('/api/export');
  return response.data;
};

export const importTestCases = async (data: any): Promise<any> => {
  const response = await api.post('/api/import', data);
  return response.data;
};

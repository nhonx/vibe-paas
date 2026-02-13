import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Project {
  id: number;
  name: string;
  type: 'static' | 'serverside';
  status: 'stopped' | 'running' | 'building' | 'failed';
  source_type: 'local' | 'github';
  source_path: string;
  subdomain: string;
  port?: number;
  container_id?: string;
  launch_command?: string;
  dockerfile_path?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  error_message?: string;
}

export interface ProjectCreate {
  name: string;
  type: 'static' | 'serverside';
  source_type: 'local' | 'github';
  source_path: string;
  launch_command?: string;
  description?: string;
}

export interface ProjectUpdate {
  description?: string;
  launch_command?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectsApi = {
  // List all projects
  list: async (): Promise<Project[]> => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  // Get a specific project
  get: async (id: number): Promise<Project> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  // Create a new project
  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await api.post('/api/projects', data);
    return response.data;
  },

  // Update a project
  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    const response = await api.put(`/api/projects/${id}`, data);
    return response.data;
  },

  // Deploy a project
  deploy: async (id: number): Promise<Project> => {
    const response = await api.post(`/api/projects/${id}/deploy`);
    return response.data;
  },

  // Start a project
  start: async (id: number): Promise<{ message: string; status: string }> => {
    const response = await api.post(`/api/projects/${id}/start`);
    return response.data;
  },

  // Stop a project
  stop: async (id: number): Promise<{ message: string; status: string }> => {
    const response = await api.post(`/api/projects/${id}/stop`);
    return response.data;
  },

  // Delete a project
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  // Get project logs
  logs: async (id: number, tail: number = 100): Promise<{ logs: string }> => {
    const response = await api.get(`/api/projects/${id}/logs`, {
      params: { tail },
    });
    return response.data;
  },
};

export default api;

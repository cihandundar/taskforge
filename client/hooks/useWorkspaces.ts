'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  ownerId: string;
  role: string;
  joinedAt: string;
  _count?: {
    members: number;
    pages: number;
  };
}

export interface CreateWorkspaceData {
  name: string;
  icon?: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  icon?: string;
  description?: string;
}

export interface WorkspaceMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  role: string;
  joinedAt: string;
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.get('/workspaces');
      setWorkspaces(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.post('/workspaces', data);
      const newWorkspace = response.data.data;

      setWorkspaces((prev) => [...prev, newWorkspace]);
      return newWorkspace;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create workspace';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkspace = async (id: string, data: UpdateWorkspaceData): Promise<Workspace> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.put(`/workspaces/${id}`, data);
      const updatedWorkspace = response.data.data;

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? updatedWorkspace : w))
      );
      return updatedWorkspace;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update workspace';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.client.delete(`/workspaces/${id}`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete workspace';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkspaceMembers = async (id: string): Promise<WorkspaceMember[]> => {
    try {
      const response = await apiClient.client.get(`/workspaces/${id}/members`);
      return response.data.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch members';
      throw new Error(errorMsg);
    }
  };

  const addMember = async (
    workspaceId: string,
    email: string,
    role: string
  ): Promise<WorkspaceMember> => {
    try {
      const response = await apiClient.client.post(`/workspaces/${workspaceId}/members`, {
        email,
        role,
      });
      return response.data.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add member';
      throw new Error(errorMsg);
    }
  };

  const removeMember = async (workspaceId: string, memberId: string): Promise<void> => {
    try {
      await apiClient.client.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to remove member';
      throw new Error(errorMsg);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return {
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    addMember,
    removeMember,
  };
}

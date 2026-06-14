'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Page {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  isPublic: boolean;
  workspaceId?: string;
  parentId?: string;
  isDeleted: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
  children?: Page[];
}

export interface CreatePageData {
  title: string;
  icon?: string;
  workspaceId?: string;
  parentId?: string;
}

export interface UpdatePageData {
  title?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
  parentId?: string;
}

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async (targetWorkspaceId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = targetWorkspaceId
        ? `/pages?workspaceId=${targetWorkspaceId}`
        : '/pages';

      const response = await apiClient.client.get(url);
      const pagesData = response.data.data;

      // Filter out deleted pages
      setPages(pagesData.filter((p: Page) => !p.isDeleted));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pages');
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPage = async (data: CreatePageData): Promise<Page> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.post('/pages', data);
      const newPage = response.data.data;

      setPages((prev) => [...prev, newPage]);
      return newPage;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create page';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePage = async (id: string, data: UpdatePageData): Promise<Page> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.put(`/pages/${id}`, data);
      const updatedPage = response.data.data;

      setPages((prev) =>
        prev.map((p) => (p.id === id ? updatedPage : p))
      );
      return updatedPage;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update page';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePage = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.client.delete(`/pages/${id}`);

      // Remove page from list (soft delete)
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete page';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const restorePage = async (id: string): Promise<Page> => {
    try {
      const response = await apiClient.client.post(`/pages/${id}/restore`);
      const restoredPage = response.data.data;

      setPages((prev) => [...prev, restoredPage]);
      return restoredPage;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to restore page';
      throw new Error(errorMsg);
    }
  };

  const getPageChildren = async (parentId: string): Promise<Page[]> => {
    try {
      const response = await apiClient.client.get(`/pages/${parentId}/children`);
      return response.data.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch page children';
      throw new Error(errorMsg);
    }
  };

  // Fetch pages on mount or when workspaceId changes
  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId]);

  return {
    pages,
    isLoading,
    error,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    restorePage,
    getPageChildren,
  };
}

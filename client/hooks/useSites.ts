'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Site {
  id: string;
  name: string;
  url: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteWithNotes extends Site {
  notes?: any[];
}

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.client.get('/sites');
      console.log('📍 Sites loaded:', response.data);
      setSites(response.data);
    } catch (err: any) {
      console.error('❌ Sites fetch error:', err);
      if (err.response?.status === 401) {
        setError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
      } else {
        setError(err.message || 'Siteler yüklenirken hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSite = async (data: Partial<Site>) => {
    try {
      const response = await apiClient.client.post('/sites', data);
      setSites([response.data, ...sites]);
      return response.data;
    } catch (err: any) {
      console.error('Site creation error:', err);
      if (err.response?.status === 401) {
        throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Site oluşturulurken hata oluştu');
    }
  };

  const updateSite = async (siteId: string, data: Partial<Site>) => {
    try {
      const response = await apiClient.client.put(`/sites/${siteId}`, data);
      setSites(sites.map(s => s.id === siteId ? response.data : s));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Site güncellenirken hata oluştu');
    }
  };

  const deleteSite = async (siteId: string) => {
    try {
      await apiClient.client.delete(`/sites/${siteId}`);
      setSites(sites.filter(s => s.id !== siteId));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Site silinirken hata oluştu');
    }
  };

  const getSiteById = async (siteId: string): Promise<SiteWithNotes> => {
    try {
      const response = await apiClient.client.get(`/sites/${siteId}`);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Site alınırken hata oluştu');
    }
  };

  const getSiteStats = async (siteId: string) => {
    try {
      const response = await apiClient.client.get(`/sites/${siteId}/stats`);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Site istatistikleri alınırken hata oluştu');
    }
  };

  return {
    sites,
    isLoading,
    error,
    createSite,
    updateSite,
    deleteSite,
    getSiteById,
    getSiteStats,
    refetch: fetchSites,
  };
}

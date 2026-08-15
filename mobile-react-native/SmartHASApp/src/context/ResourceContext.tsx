import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { api } from '../config/api';
import { Resource, resourceFromJson, resourceToCreateJson } from '../types';

interface ResourceContextValue {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  fetchResources: () => Promise<void>;
  addResource: (resource: Partial<Resource>) => Promise<void>;
}

const ResourceContext = createContext<ResourceContextValue | undefined>(undefined);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega GET /api/resources (recursos de todos os usuários,
  // persistidos no backend Spring Boot).
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/resources');
      const content = Array.isArray(response) ? response : response?.content ?? [];
      setResources(content.map(resourceFromJson));
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Publica um novo recurso via POST /api/resources (exige login).
  const addResource = useCallback(async (resource: Partial<Resource>) => {
    const response = await api.post('/resources', resourceToCreateJson(resource), true);
    setResources((prev) => [resourceFromJson(response), ...prev]);
  }, []);

  const value = useMemo(
    () => ({ resources, isLoading, error, fetchResources, addResource }),
    [resources, isLoading, error, fetchResources, addResource]
  );

  return <ResourceContext.Provider value={value}>{children}</ResourceContext.Provider>;
}

export function useResources(): ResourceContextValue {
  const ctx = useContext(ResourceContext);
  if (!ctx) throw new Error('useResources deve ser usado dentro de ResourceProvider');
  return ctx;
}

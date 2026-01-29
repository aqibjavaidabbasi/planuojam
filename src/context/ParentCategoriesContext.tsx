'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchParentCategories } from '@/services/common';
import { category } from '@/types/pagesTypes';
import { useLocale } from 'next-intl';

type ServiceType = 'vendor' | 'venue';

interface ParentCategoriesContextProps {
  parentCategories: category[];
  isLoading: boolean;
  error: string | null;
  // Maps for convenience
  parentBySlug: Record<string, category | undefined>;
  getServiceTypeFromParentId: (documentId: string) => ServiceType | undefined;
  getServiceTypeFromSlug: (slug: string) => ServiceType | undefined;
  getServiceCategoryBySlug: (slug: string) => category | undefined;
  getServiceCategoryByDocId: (docId: string) => category | undefined;
}

const ParentCategoriesContext = createContext<ParentCategoriesContextProps | undefined>(undefined);

const ParentCategoriesProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [parentCategories, setParentCategories] = useState<category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const fetchParentCategoriesAsync = async () => {
      setIsLoading(true);
      try {
        const data = await fetchParentCategories('en'); // Always fetch parent categories in English
        setParentCategories(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchParentCategoriesAsync();
  }, [locale]);

  const parentBySlug = Object.fromEntries(
    (parentCategories || []).map((p) => [p.slug, p])
  );

  const getServiceTypeFromParentId = (documentId: string): ServiceType | undefined =>{
    const category = parentCategories.find(cat => cat.documentId === documentId);
    return category?.serviceType as ServiceType | undefined;
  }

  const getServiceTypeFromSlug = (slug: string): ServiceType | undefined => {
    const parent = parentBySlug[slug];
    return parent?.serviceType as ServiceType | undefined;
  };

  const getServiceCategoryBySlug = (slug: string) : category | undefined =>{
    return parentCategories.find(type => type.slug === slug);
  }

  const getServiceCategoryByDocId = (docId: string): category | undefined => {
   return parentCategories.find(type => type.documentId === docId);
  }

  return (
    <ParentCategoriesContext.Provider value={{ 
      parentCategories, 
      isLoading,
      error, 
      parentBySlug, 
      getServiceTypeFromParentId, 
      getServiceTypeFromSlug, 
      getServiceCategoryBySlug, 
      getServiceCategoryByDocId 
    }}>
      {children}
    </ParentCategoriesContext.Provider>
  );
};

const useParentCategories = () => {
  const context = useContext(ParentCategoriesContext);
  if (!context) {
    throw new Error('useParentCategories must be used within a ParentCategoriesProvider');
  }
  return context;
};

export { ParentCategoriesProvider, useParentCategories };
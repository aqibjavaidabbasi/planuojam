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
  VENUE_DOC_ID: string;
  VENDOR_DOC_ID: string;
}

const VENUE_DOC_ID = "cvf586kao1521ew8lb1vl540";
const VENDOR_DOC_ID = "no20d9ryuyfvtu6dhsqxfej7";


const ParentCategoriesContext = createContext<ParentCategoriesContextProps | undefined>(undefined);

const ParentCategoriesProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [parentCategories, setParentCategories] = useState<category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  // Provided by user: stable document IDs across locales
  const SERVICE_TYPE_BY_PARENT_ID: Record<string, ServiceType> = {
    VENUE_DOC_ID: 'venue',
    VENDOR_DOC_ID: 'vendor',
  };

  useEffect(() => {
    const fetchParentCategoriesAsync = async () => {
      setIsLoading(true);
      try {
        const data = await fetchParentCategories(locale);
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
   return documentId === VENUE_DOC_ID ? 'venue' : documentId === VENDOR_DOC_ID ? 'vendor' : undefined;
  }

  const getServiceTypeFromSlug = (slug: string): ServiceType | undefined => {
    const parent = parentBySlug[slug];
    if (!parent?.documentId) return undefined;
    return SERVICE_TYPE_BY_PARENT_ID[parent.documentId];
  };

  return (
    <ParentCategoriesContext.Provider value={{ parentCategories, isLoading, error, parentBySlug, getServiceTypeFromParentId, getServiceTypeFromSlug, VENUE_DOC_ID, VENDOR_DOC_ID   }}>
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
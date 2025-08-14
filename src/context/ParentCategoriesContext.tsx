'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchParentCategories } from '@/services/common';
import { category } from '@/types/pagesTypes';

interface ParentCategoriesContextProps {
  parentCategories: category[];
  isLoading: boolean;
  error: string | null;
}

const ParentCategoriesContext = createContext<ParentCategoriesContextProps | undefined>(undefined);

const ParentCategoriesProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [parentCategories, setParentCategories] = useState<category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentCategoriesAsync = async () => {
      setIsLoading(true);
      try {
        const data = await fetchParentCategories();
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
  }, []);

  return (
    <ParentCategoriesContext.Provider value={{ parentCategories, isLoading, error }}>
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
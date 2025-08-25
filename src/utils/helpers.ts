import { SelectedCategoriesList } from "@/types/pagesTypes";

export function getCompleteImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

export function filterUniqueCategoriesByParent(data: SelectedCategoriesList) {
  // Deduplicate based on category.documentId and filter by parentCategory.parent.name
  return data.categoryListItem.filter(
    (item, index, self) =>
      // Keep first occurrence of documentId
      index ===
        self.findIndex(
          (t) => t.category.documentId === item.category.documentId
        ) &&
      // Match parent category name
      item.category.parentCategory?.name === data.parentCategory.parent.name
  );
}

// Utility: safely extract Strapi v5 error message
export const getStrapiErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (data.error && typeof data.error === 'object') {
          const errorData = data.error as Record<string, unknown>;
          if (typeof errorData.message === 'string') {
            return errorData.message;
          }
        }
      }
    }
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  return "An unexpected error occurred";
};
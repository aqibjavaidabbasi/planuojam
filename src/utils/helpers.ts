import { SelectedCategoriesList } from "@/types/pagesTypes";

export function getCompleteImageUrl(path: string){
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`
}

export function filterUniqueCategoriesByParent(data: SelectedCategoriesList) {
    // Deduplicate based on category.documentId and filter by parentCategory.parent.name
    return data.categoryListItem.filter(
      (item, index, self) =>
        // Keep first occurrence of documentId
        index === self.findIndex((t) => t.category.documentId === item.category.documentId) &&
        // Match parent category name
        item.category.parentCategory?.name === data.parentCategory.parent.name
    );
  }
import { fetchAPI } from "./api";

export interface Tag {
    id: string;
    documentId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
    localizations: Tag[];
}

export async function fetchTagsByIds(tagIds: string[], locale?: string): Promise<Tag[]> {
    if (!tagIds.length) return [];
    
    const populate = '*';
    const query = locale ? `populate=${populate}&locale=${encodeURIComponent(locale)}` : `populate=${populate}`;
    const filters = {
        filters: {
            documentId: { $in: tagIds }
        }
    };
    
    const data = await fetchAPI(`tags`, query, filters);
    return Array.isArray(data) ? data : [];
}

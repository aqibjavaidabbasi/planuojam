export interface strapiImage{
    url: string;
    width: number;
    formats: {
        small: {
            url: string;
            width: number;
        },
        medium: {
            url: string;
            width: number;
        },
        thumbnail: {
            url: string;
            width: number;
        }
    }
}

export interface User{
    username: string;
    email: string;
    blocked: boolean;
    confirmed: boolean;
    id: number;
    documentId: string;
}
export interface User{
    username: string;
    email: string;
    blocked: boolean;
    confirmed: boolean;
    id: number;
    documentId: string;
    serviceType: string | null;
    totalStars?: number;
    stripeCustomerId?: string;
}


export type CreateListingFormTypes = {
    title: string;
    slug: string;
    price: number;
    type: string;
    listingStatus: "draft" | "pending review" | "published" | "archived";
    category: string;
    mainImageId: string;
    tagDocumentIds: string[];
    videos: { url: string }[];
    description: string;
    autoTranslateOnUpdate: boolean;
    mediaOrder?: string; // Added for tracking media item order
    listingItem: {
        __component: "dynamic-blocks.venue" | "dynamic-blocks.vendor";
        location?: {
            address?: string;
            latitude?: string;
            longitude?: string;
            city?: string;
            state?: string;
        };
        capacity?: number;
        amneties?: {
            text: string;
        }[];
        bookingDuration?: number;
        bookingDurationType?: "Per Day" | "Per Hour";
        minimumDuration?: number;
        about?: string;
        experienceYears?: number;
        serviceArea?: {
            latitude?: string;
            longitude?: string;
            city?: string;
            state?: string;
        }[];
    }[];
    contact?: {
        address: string;
        phone?: string;
        email: string;
    }
    socialLinks?: {
        optionalSectionTitle?: string;
        socialLink?: {
            link?: string;
            platform?: "facebook" | "linkedin" | "youtube" | "instagram" | "tiktok" | "pinterest" | "twitter" | "thread" | "reddit";
            visible: boolean;
        }[];
    }
    websiteLink?: string;
    workingSchedule?: {
        day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
        start: string;
        end: string;
    }[];
    pricingPackages?: {
        sectionTitle: string;
        plans: {
            name: string;
            price: number;
            isPopular: boolean;
            cta: {
                bodyText: string;
                buttonUrl?: string;
                style: "primary" | "secondary";
            }
            featuresList: {
                statement: string;
            }[]
        }[];
        optionalAddons: {
            statement: string;
            price: number;
        }[];
    }
    portfolio?: number[];
    FAQs?: {
        sectionTitle?: string;
        items: {
            question: string;
            answer: string;
        }[];
        numberOfColumns: "one" | "two";
    };
    user: string;
    eventTypes: {
        set?: string[];
        connect?: string[];
    };
    hotDeal?: {
        enableHotDeal: boolean;
        discount: {
            discountType: "Flat Rate" | "Percentage";
            percentage?: number;
            flatRatePrice?: number;
        }
        dealNote?: string;
        startDate?: string;
        lastDate?: string;
    };
    locale: string;
}
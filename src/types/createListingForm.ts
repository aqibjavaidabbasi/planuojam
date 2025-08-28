export type CreateListingFormTypes = {
    title: string;
    slug: string;
    price: number;
    type: string;
    listingStatus: "draft" | "pending review" | "published" | "archived";
    featured: boolean;
    category: string;
    description: string;
    tags: string[] //use set in creation, set replaces the existing ones
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
    workingHours?: number;
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

//date examples for strapi payload, choose one as per the one you have configured
// "eventDate": "2024-06-01"
//"eventDate": "2024-06-01T12:00:00Z"
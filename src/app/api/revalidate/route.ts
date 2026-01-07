import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { SUPPORTED_LOCALES } from "../../../config/i18n";

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";

        const safeParseJson = async (): Promise<unknown> => {
            try {
                return await req.json();
            } catch {
                return undefined;
            }
        };

        const parseBody = async (): Promise<Record<string, unknown>> => {
            if (contentType.includes("application/json")) {
                const data = await safeParseJson();
                if (data && typeof data === "object") return data as Record<string, unknown>;
            }

            if (contentType.includes("application/x-www-form-urlencoded")) {
                try {
                    const form = await req.formData();
                    return Object.fromEntries(form.entries());
                } catch {
                }
            }

            if (contentType.includes("text/plain")) {
                try {
                    const text = await req.text();
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
                        return {};
                    } catch {
                        return { raw: text } as Record<string, unknown>;
                    }
                } catch {
                }
            }

            try {
                const text = await req.text();
                if (text) {
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
                        return {};
                    } catch {
                        return {};
                    }
                }
            } catch {
            }

            return {};
        };

        type StrapiEntry = { slug?: unknown; locale?: unknown; model?: unknown; service?: unknown };
        type ParsedBody = {
            slug?: unknown;
            locale?: unknown;
            model?: unknown;
            uid?: unknown;
            documentId?: unknown;
            path?: unknown;
            paths?: unknown;
            segments?: unknown;
            entry?: StrapiEntry;
            [k: string]: unknown;
        };

        const body = (await parseBody()) as ParsedBody;
        
        const headerData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/header?populate[nav][populate]=*&populate[eventTypes][populate]=*&locale=en`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
            }
        })
        const header = await headerData.json();

        const nav = header.data.nav;
        const eventTypes = header.data.eventTypes;

        const bodyLocale = body?.locale ?? body?.entry?.locale;
        const bodyModal: string = body?.model as string ?? body?.entry?.model as string;
        let slugToValidate;
        const targets: string[] = []

        if (bodyLocale === 'en') {
            slugToValidate = body?.slug ?? body?.entry?.slug;
            for (const locale of SUPPORTED_LOCALES) {
                if (bodyModal.includes('listing')) {
                    //root page
                    targets.push('/')
                    //for home page
                    targets.push(`/${locale}`)
                    //for listing details page
                    targets.push(`/${locale}/listing/${slugToValidate}`);
                    //for hot deal page
                    targets.push(`/${locale}/hot-deal`)

                    //services pages
                    nav.categories.forEach((category: { slug: string; }) => {
                        targets.push(`/${locale}/service/${category.slug}`)
                    })
                    //for profile page
                    targets.push(`/${locale}/profile`)
                    //edit listing page
                    targets.push(`/${locale}/listing/${slugToValidate}/edit`)
                    
                    //event type pages
                    eventTypes.forEach((et: { eventType: { slug: string; }; }) => {
                        targets.push(`/${locale}/event-types/${et.eventType.slug}`)
                    })
                }
                if (bodyModal.includes('page')) {
                    //root page
                    targets.push('/')
                    //for pages like about-us, privacy-policy
                    targets.push(`/${locale}/${slugToValidate}`)
                    // for pages like home page
                    targets.push(`/${locale}`)
                    //for hot deal page
                    targets.push(`/${locale}/hot-deal`)
                    //for event types page
                    targets.push(`/${locale}/event-types/${slugToValidate}`)
                    //for about us page
                    targets.push(`/${locale}/about-us`)
                    //for contact us page
                    targets.push(`/${locale}/contact-us`)

                }
                if (bodyModal.includes('event-type')) {
                    //root page
                    targets.push('/')
                     //event type pages
                    eventTypes.forEach((et: { eventType: { slug: string; }; }) => {
                        targets.push(`/${locale}/event-types/${et.eventType.slug}`)
                    })
                    //for hot deal page
                    targets.push(`/${locale}/hot-deal`)
                }
                if (bodyModal.includes('category')) {
                    //root page
                    targets.push('/')
                    //for home page
                    targets.push(`/${locale}`)
                     //services pages
                    nav.categories.forEach((category: { slug: string; }) => {
                        targets.push(`/${locale}/service/${category.slug}`)
                    })
                    //for hot deal page
                    targets.push(`/${locale}/hot-deal`)
                }
                if (bodyModal.includes('city') || bodyModal.includes('country') || bodyModal.includes('state')) {
                    //root page
                    targets.push('/')
                    //for home page
                    targets.push(`/${locale}`)
                    //profile page as it include create listing form which uses cities, countries and states
                    targets.push(`/${locale}/profile`)
                }
                // if (bodyModal.includes('liked-listing')) {
                //     //root page
                //     targets.push('/')
                //     //for home page
                //     targets.push(`/${locale}`)
                //     //for profile page as it has liked listing tab
                //     targets.push(`/${locale}/profile`)
                //     //services pages
                //     nav.categories.forEach((category: { slug: string; }) => {
                //         targets.push(`/${locale}/service/${category.slug}`)
                //     })
                //     //event type pages
                //     eventTypes.forEach((et: { eventType: { slug: string; }; }) => {
                //         targets.push(`/${locale}/event-types/${et.eventType.slug}`)
                //     })
                //     //for hot deal page
                //     targets.push(`/${locale}/hot-deal`)
                // }
                if (bodyModal.includes('header') || bodyModal.includes('footer') || bodyModal.includes('site-setting')) {
                    //root page
                    targets.push('/')
                    //just refresh home page, it should revalidate all single types
                    targets.push(`/${locale}`)
                    //about us and contact us
                    targets.push(`/${locale}/about-us`)
                    targets.push(`/${locale}/contact-us`)
                }
            }
        }

        for (const p of targets) {
            revalidatePath(p)
        };

        return NextResponse.json({ revalidated: true, paths: Array.from(targets) });
    } catch (err) {
        console.error("Revalidate error:", err);
        return NextResponse.json({ error: "Invalid payload" }, { status: 500 });
    }
}

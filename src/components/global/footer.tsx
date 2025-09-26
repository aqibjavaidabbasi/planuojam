'use client' //for interactivity that might be added later
import { Link } from '@/i18n/navigation';
import { category, EventTypes, footer } from '@/types/pagesTypes';
import { useTranslations } from 'next-intl';

const IMP_IDS = {
    'privacy': "fvrfcj6up74ua7y459jbxt6t",
    'tos': "d1wrcza11cao15fm3mg2xibi",
    'about': "w9xmo2id7rjddo44es246xzl",
}

function Footer({ footerData }: { footerData: footer }) {
    const t=useTranslations("ContactUs")

    // Build locale-aware URLs similar to header logic, preferring English slugs
    const getServiceUrl = (category: category) => {
        if (!category) return '/';
        if (category.locale === 'en') return `/service/${category.slug}`;
        const enEntry = category.localizations?.find((loc) => loc.locale === 'en');
        return enEntry ? `/service/${enEntry.slug}` : `/service/${category.slug}`;
    };

    const getEventTypeUrl = (eventType: EventTypes) => {
        if (!eventType) return '/';
        if (eventType.locale === 'en') return `/event-types/${eventType.slug}`;
        const enEntry = eventType.localizations?.find((loc) => loc.locale === 'en');
        return enEntry ? `/event-types/${enEntry.slug}` : `/event-types/${eventType.slug}`;
    };

    return (
        <div className='bg-footer-background w-full text-primary p-5' >
            <div className='flex justify-start md:justify-between flex-col md:flex-row max-w-screen lg:max-w-[1700px] mx-auto'>
                {footerData?.footerlinkSection.map(section => (
                    <div key={section.id} className='py-3'>
                        <p className='text-white font-semibold mb-2 capitalize'>{section.title}</p>
                        {/* categories */}
                        {section.linksType.toLowerCase() === 'categories' && <div className='flex flex-col gap-1'>
                            {section.categories.map(item => (
                                <Link className='hover:underline capitalize'
                                    href={getServiceUrl(item)} key={item.id}>
                                    {item.name}
                                </Link>
                            ))}
                        </div>}

                        {/* event types */}
                        {section.linksType.toLowerCase() === 'events' && <div className='flex flex-col gap-1'>
                            {section.event_types.map(item => (
                                <Link className='hover:underline capitalize' href={getEventTypeUrl(item)} key={item.id}>
                                    {item.eventName}
                                </Link>
                            ))}
                            <Link href={'/hot-deal'} >{t("hotdeal")}</Link>
                        </div>}

                        {/* page */}
                        {section.linksType.toLowerCase() === 'page' && <div className='flex flex-col gap-1'>
                            {section.pages.map(item => (<Link className='hover:underline capitalize' href={item.documentId === IMP_IDS.privacy ? '/privacy-policy' : item.documentId === IMP_IDS.tos ? '/terms-of-service' : item.documentId === IMP_IDS.about ? '/about-us' : '/'} key={item.documentId}>
                                {item.title}
                            </Link>))}
                            <Link href={'/contact-us'} >{t('contact')}</Link>
                        </div>}
                    </div>))}
            </div>
            <div className='flex items-center justify-between mt-4 pt-3 border-t-[0.5px] border-border flex-col md:flex-row max-w-screen lg:max-w-[1700px] mx-auto'>
                <div className='flex items-center gap-2.5'>
                    {footerData?.extraLinks.pages.map((link, idx, arr) => (
                        <span key={link.documentId} className='flex items-center gap-2'>
                            <Link
                                className='hover:underline capitalize'
                                href={link.documentId === IMP_IDS.privacy ? '/privacy-policy' : link.documentId === IMP_IDS.tos ? '/terms-of-service' : link.documentId === IMP_IDS.about ? '/about-us' : '/'}>
                                {link.title}
                            </Link>
                            {idx < arr.length - 1 && (
                                <span className="mx-2 text-white select-none">|</span>
                            )}
                        </span>
                    ))}
                </div>
                <p className='text-white'>&copy; {footerData?.copyRightText}</p>
            </div>
        </div>
    )
}

export default Footer
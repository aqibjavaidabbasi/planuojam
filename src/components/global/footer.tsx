'use client' //for interactivity that might be added later
import { Link } from '@/i18n/navigation';
import { footer } from '@/types/pagesTypes';
import { useTranslations } from 'next-intl';

const IMP_IDS = {
    'privacy': "fvrfcj6up74ua7y459jbxt6t",
    'tos': "d1wrcza11cao15fm3mg2xibi",
    'about': "w9xmo2id7rjddo44es246xzl",
}

function Footer({ footerData }: { footerData: footer }) {
    const t=useTranslations("ContactUs")

    return (
        <div className='bg-footer-background w-screen text-primary p-5' >
            <div className='flex justify-start md:justify-between flex-col md:flex-row'>
                {footerData?.footerlinkSection.map(section => (
                    <div key={section.id} className='py-3'>
                        <p className='text-white font-semibold mb-2 capitalize'>{section.title}</p>
                        {/* categories */}
                        {section.linksType.toLowerCase() === 'categories' && <div className='flex flex-col gap-1'>
                            {section.categories.map(item => (<Link className='hover:underline capitalize' 
                            href={`/service/${item.documentId}`} key={item.id}>
                                {item.name}
                            </Link>))}
                        </div>}

                        {/* event types */}
                        {section.linksType.toLowerCase() === 'events' && <div className='flex flex-col gap-1'>
                            {section.event_types.map(item => (<Link className='hover:underline capitalize' href={`/event-types/${item.documentId}`} key={item.id}>
                                {item.eventName}
                            </Link>))}
                            <Link href={'/hot-deal'} >{t("hotdeal")}</Link>
                        </div>}

                        {/* page */}
                        {section.linksType.toLowerCase() === 'page' && <div className='flex flex-col gap-1'>
                            {section.pages.map(item => (<Link className='hover:underline capitalize' href={item.documentId === IMP_IDS.privacy ? '/privacy-policy' : item.documentId === IMP_IDS.tos ? '/terms-of-service' : item.documentId === IMP_IDS.about ? '/about' : '/'} key={item.documentId}>
                                {item.title}
                            </Link>))}
                            <Link href={'/contact-us'} >{t('contact')}</Link>
                        </div>}
                    </div>))}
            </div>
            <div className='flex items-center justify-between mt-4 pt-3 border-t-[0.5px] border-border flex-col md:flex-row'>
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
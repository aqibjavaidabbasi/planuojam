'use client' //for interactivity that might be added later
import { Link } from '@/i18n/navigation';
import { footer } from '@/types/pagesTypes';

function Footer({footerData}: {footerData: footer}) {

    return (
        <div className='bg-footer-background w-screen text-primary p-5' >
            <div className='flex justify-start md:justify-between flex-col md:flex-row'>
                {footerData?.footerlinkSection.map(section => (
                    <div key={section.id} className='py-3'>
                    <p className='text-white font-semibold mb-2 capitalize'>{section.title}</p>
                    <div className='flex flex-col gap-1'>
                        {section.navItem.map(item => (<Link className='hover:underline capitalize' href={item.relativeUrl} key={item.id}>
                            {item.label}
                        </Link>))}
                    </div>
                </div>))}
            </div>
            <div className='flex items-center justify-between mt-4 pt-3 border-t-[0.5px] border-border flex-col md:flex-row'>
                <div className='flex items-center gap-2.5'>
                    {footerData?.extraLinks.map((link, idx, arr) => (
                        <span key={link.id} className='flex items-center gap-2'>
                            <Link className='hover:underline capitalize' href={link.relativeUrl}>
                                {link.label}
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
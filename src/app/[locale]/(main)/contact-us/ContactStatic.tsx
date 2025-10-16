"use client";

import { useTranslations } from 'next-intl';
import { formatPhoneDisplay, getTelHref } from '@/utils/phone';

type Props = {
  address?: string;
  email?: string;
  phone?: string;
  description?: string; // from site-setting.contactDescription
  socialLinks?: { platform: string; link: string; visible?: boolean }[]; // from site-setting.socialLink
};

export default function ContactStatic({ address, email, phone, description, socialLinks }: Props) {
  const t = useTranslations('Contact');
  const visibleSocials = (socialLinks || []).filter((s) => s.link && s.visible !== false);

  const normalizeLink = (link: string) => {
    if (!link) return '#';
    const hasProtocol = /^https?:\/\//i.test(link);
    return hasProtocol ? link : `https://${link.replace(/^\/+/, '')}`;
  };
  return (
    <div className="space-y-8 text-gray-700">
      {description && (
        <div>
          <p className="text-gray-700">{description}</p>
        </div>
      )}
      <div>
        <h3 className="text-xl font-semibold mb-2">{t('chatWithUs.title')}</h3>
        <ul className="space-y-1 flex gap-1.5">
          {visibleSocials.map((s, idx) => (
            <li key={`${s.platform}-${idx}`}>
              <a
                href={normalizeLink(s.link)}
                className="text-black hover:underline capitalize"
                target="_blank"
                rel="noreferrer"
              >
                {s.platform}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {email && (
        <div>
          <h3 className="text-xl font-semibold mb-2">{t('emailUs.title')}</h3>
          <a href={`mailto:${email}`} className="text-black hover:underline">{email}</a>
        </div>
      )}
      {(() => {
        const formatted = formatPhoneDisplay(phone)
        const telHref = getTelHref(phone)
        if (!formatted || !telHref) return null
        return (
          <div>
            <h3 className="text-xl font-semibold mb-2">{t('callUs.title')}</h3>
            <a href={telHref} className="text-black hover:underline">{formatted}</a>
          </div>
        )
      })()}
      {address && (
        <div>
          <h3 className="text-xl font-semibold mb-2">{t('visitUs.title')}</h3>
          <p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noreferrer"
              className="text-black font-medium hover:underline"
            >
              {address}
            </a>
          </p>
          {/* Embedded map */}
          <div className="mt-4 w-full overflow-hidden rounded-md border">
            <iframe
              title={t('visitUs.mapTitle')}
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="w-full h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  );
}

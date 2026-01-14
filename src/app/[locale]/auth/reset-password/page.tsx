import ResetPasswordPageClient from "./ResetPasswordPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.ResetPassword' });
  
  return {
    title: t('title'),
    description: t('subtitle', { default: 'Reset your password securely' }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}

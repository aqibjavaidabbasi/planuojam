import RegisterPageClient from "./RegisterPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.Register' });
  
  return {
    title: t('title'),
    description: t('subtitle'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RegisterPage() {
  return <RegisterPageClient />;
}

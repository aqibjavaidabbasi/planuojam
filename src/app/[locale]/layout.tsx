import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ParentCategoriesProvider } from "@/context/ParentCategoriesContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { EventTypesProvider } from "@/context/EventTypesContext";
import { StatesProvider } from "@/context/StatesContext";
import { CitiesProvider } from "@/context/CitiesContext";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import ReduxProvider from "@/store/provider";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import "./globals.css";


const MapboxWrapper = dynamic(() => import("./MapboxWrapper"));

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}



export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Rely on next-intl request config to provide messages
  const messages = await getMessages();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html>
      <body className="min-h-screen overflow-x-hidden">
        <ReduxProvider>
          <MapboxWrapper>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ParentCategoriesProvider>
                <SiteSettingsProvider>
                  <EventTypesProvider>
                    <StatesProvider>
                      <CitiesProvider>
                        {children}
                      </CitiesProvider>
                    </StatesProvider>
                  </EventTypesProvider>
                </SiteSettingsProvider>
              </ParentCategoriesProvider>
            </NextIntlClientProvider>
          </MapboxWrapper>
        </ReduxProvider>
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}


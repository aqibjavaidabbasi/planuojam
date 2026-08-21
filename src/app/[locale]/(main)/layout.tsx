import { Suspense } from "react";
import Footer from "@/components/global/footer";
import Header from "@/components/global/header";
import { setRequestLocale } from "next-intl/server";
import { fetchFooter, fetchHeader } from "@/services/pagesApi";


export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // next-intl reads the locale from headers() unless it's set explicitly, which opts
  // every route under this layout into dynamic rendering (responses came back
  // `cache-control: no-store`, so `export const revalidate` never took effect).
  setRequestLocale(locale);
  const headerData = await fetchHeader(locale);
  const footerData = await fetchFooter(locale);

  return (
    <div>
      {/* Header calls useSearchParams(), which opts the whole route out of static
          rendering (BAILOUT_TO_CLIENT_SIDE_RENDERING) — every prerendered page shipped a
          spinner instead of content. Scoping it to a Suspense boundary keeps the page body,
          footer and their links in the server-rendered HTML. */}
      <Suspense fallback={null}>
        <Header headerData={headerData} />
      </Suspense>
      <main>{children}</main>
      <Footer footerData={footerData} />
    </div>
  );
}

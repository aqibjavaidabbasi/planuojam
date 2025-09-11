import Footer from "@/components/global/footer";
import Header from "@/components/global/header";
import { fetchFooter, fetchHeader } from "@/services/pagesApi";


export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const headerData = await fetchHeader(locale);
  const footerData = await fetchFooter(locale);

  return (
    <div>
      <Header headerData={headerData} />
      <main>{children}</main>
      <Footer footerData={footerData} />
    </div>
  );
}

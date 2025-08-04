import Footer from "@/components/global/footer";
import Header from "@/components/global/header";
import { fetchFooter, fetchHeader } from "@/services/pagesApi";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerData = await fetchHeader();
  const footerData = await fetchFooter();

  return (
    <div>
      <Header headerData={headerData} />
      <main>{children}</main>
      <Footer footerData={footerData} />
    </div>
  );
}

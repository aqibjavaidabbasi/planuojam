import "./globals.css";
import Header from "@/components/global/header";
import Footer from "@/components/global/footer";
import { fetchSiteSettings } from "@/services/siteSettings";

export default async function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettingsData = await fetchSiteSettings();

  return (
    <html lang="en">
      <body>
        <Header logo={siteSettingsData.siteLogo} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

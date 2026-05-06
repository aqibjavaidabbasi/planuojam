import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type Locale = "en" | "lt" | "ru" | "pl" | "et";

interface InvoiceEmailProps {
  username: string;
  invoiceNumber: string;
  invoiceUrl: string;
  locale?: string;
}

const strings: Record<Locale, {
  preview: (invoiceNumber: string) => string;
  title: string;
  greeting: (username: string) => string;
  body: (invoiceNumber: string) => string;
  cta: string;
  footer: string;
}> = {
  en: {
    preview: (n) => `Your invoice ${n} is ready`,
    title: "Invoice Ready",
    greeting: (u) => `Hello, ${u},`,
    body: (n) => `Your invoice ${n} is ready. You can view and download it using the button below.`,
    cta: "View Invoice",
    footer: "\u00a9 2026 Planuojam. All rights reserved.",
  },
  lt: {
    preview: (n) => `J\u016bs\u0173 s\u0105skaita ${n} paruo\u0161ta`,
    title: "S\u0105skaita paruo\u0161ta",
    greeting: (u) => `Sveiki, ${u},`,
    body: (n) => `J\u016bs\u0173 s\u0105skaita ${n} paruo\u0161ta. J\u0105 galite per\u017ei\u016br\u0117ti ir atsisi\u0173sti paspaud\u0119 \u017eemiau esant\u012f mygtuk\u0105.`,
    cta: "Per\u017ei\u016br\u0117ti s\u0105skait\u0105",
    footer: "\u00a9 2026 Planuojam. Visos teis\u0117s saugomos.",
  },
  ru: {
    preview: (n) => `\u0412\u0430\u0448 \u0441\u0447\u0435\u0442 ${n} \u0433\u043e\u0442\u043e\u0432`,
    title: "\u0421\u0447\u0435\u0442 \u0433\u043e\u0442\u043e\u0432",
    greeting: (u) => `\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, ${u},`,
    body: (n) => `\u0412\u0430\u0448 \u0441\u0447\u0435\u0442 ${n} \u0433\u043e\u0442\u043e\u0432. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0438 \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u0435\u0433\u043e \u043f\u043e \u043a\u043d\u043e\u043f\u043a\u0435 \u043d\u0438\u0436\u0435.`,
    cta: "\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0441\u0447\u0435\u0442",
    footer: "\u00a9 2026 Planuojam. \u0412\u0441\u0435 \u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043d\u044b.",
  },
  pl: {
    preview: (n) => `Twoja faktura ${n} jest gotowa`,
    title: "Faktura gotowa",
    greeting: (u) => `Witaj, ${u},`,
    body: (n) => `Twoja faktura ${n} jest gotowa. Mo\u017cesz j\u0105 wy\u015bwietli\u0107 i pobra\u0107, klikaj\u0105c poni\u017cszy przycisk.`,
    cta: "Zobacz faktur\u0119",
    footer: "\u00a9 2026 Planuojam. Wszelkie prawa zastrze\u017cone.",
  },
  et: {
    preview: (n) => `Teie arve ${n} on valmis`,
    title: "Arve on valmis",
    greeting: (u) => `Tere, ${u},`,
    body: (n) => `Teie arve ${n} on valmis. Saate seda vaadata ja alla laadida alloleva nupu kaudu.`,
    cta: "Vaata arvet",
    footer: "\u00a9 2026 Planuojam. K\u00f5ik \u00f5igused kaitstud.",
  },
};

export default function InvoiceEmail({
  username,
  invoiceNumber,
  invoiceUrl,
  locale = "en",
}: InvoiceEmailProps) {
  const normalizedLocale = locale.toLowerCase().split("-")[0] as Locale;
  const key = normalizedLocale in strings ? normalizedLocale : "en";
  const t = strings[key];

  return (
    <Html>
      <Head />
      <Preview>{t.preview(invoiceNumber)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{t.title}</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h2}>{t.greeting(username)}</Heading>
            <Text style={paragraph}>{t.body(invoiceNumber)}</Text>
            <Section style={btnContainer}>
              <Button style={button} href={invoiceUrl}>
                {t.cta}
              </Button>
            </Section>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily: 'Montserrat, "Helvetica Neue", Helvetica, Arial, sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};
const header = {
  background: "linear-gradient(135deg, #cc922f 0%, #b8821a 100%)",
  padding: "40px 20px",
  textAlign: "center" as const,
};
const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "1px",
};
const content = { padding: "40px", color: "#333333" };
const h2 = { fontSize: "20px", marginBottom: "20px", color: "#111111" };
const paragraph = { fontSize: "16px", lineHeight: "1.6", margin: "0 0 15px" };
const btnContainer = { textAlign: "center" as const, margin: "30px 0" };
const button = {
  backgroundColor: "#cc922f",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "15px 35px",
};
const footer = {
  backgroundColor: "#111111",
  padding: "30px 20px",
  textAlign: "center" as const,
};
const footerText = { color: "#999999", fontSize: "14px", margin: "5px 0" };

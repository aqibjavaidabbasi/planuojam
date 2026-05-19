import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { normalizeEmailSubjectLocale } from "@/utils/emailSubjects";

interface ContactEmailProps {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  message: string;
  locale?: string;
}

type Locale = "en" | "lt" | "ru" | "pl" | "et";

const strings: Record<Locale, {
  preview: (name: string) => string;
  title: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  countryLabel: string;
  messageLabel: string;
  naValue: string;
  footer: string;
}> = {
  en: {
    preview: (name) => `New Contact Message from ${name}`,
    title: "New Contact Message",
    nameLabel: "Name:",
    emailLabel: "Email:",
    phoneLabel: "Phone:",
    countryLabel: "Country:",
    messageLabel: "Message:",
    naValue: "N/A",
    footer: "\u00a9 2026 Planuojam. All rights reserved.",
  },
  lt: {
    preview: (name) => `Nauja kontaktin\u0117 \u017einut\u0117 nuo ${name}`,
    title: "Nauja kontaktin\u0117 \u017einut\u0117",
    nameLabel: "Vardas:",
    emailLabel: "El. pa\u0161tas:",
    phoneLabel: "Telefonas:",
    countryLabel: "\u0160alis:",
    messageLabel: "\u017dinut\u0117:",
    naValue: "Nenurodyta",
    footer: "\u00a9 2026 Planuojam. Visos teis\u0117s saugomos.",
  },
  ru: {
    preview: (name) => `\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0438\u0437 \u0444\u043e\u0440\u043c\u044b \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043e\u0432 \u043e\u0442 ${name}`,
    title: "\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0438\u0437 \u0444\u043e\u0440\u043c\u044b \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043e\u0432",
    nameLabel: "\u0418\u043c\u044f:",
    emailLabel: "\u042d\u043b. \u043f\u043e\u0447\u0442\u0430:",
    phoneLabel: "\u0422\u0435\u043b\u0435\u0444\u043e\u043d:",
    countryLabel: "\u0421\u0442\u0440\u0430\u043d\u0430:",
    messageLabel: "\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435:",
    naValue: "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e",
    footer: "\u00a9 2026 Planuojam. \u0412\u0441\u0435 \u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043d\u044b.",
  },
  pl: {
    preview: (name) => `Nowa wiadomo\u015b\u0107 kontaktowa od ${name}`,
    title: "Nowa wiadomo\u015b\u0107 kontaktowa",
    nameLabel: "Imi\u0119:",
    emailLabel: "E-mail:",
    phoneLabel: "Telefon:",
    countryLabel: "Kraj:",
    messageLabel: "Wiadomo\u015b\u0107:",
    naValue: "Brak",
    footer: "\u00a9 2026 Planuojam. Wszelkie prawa zastrze\u017cone.",
  },
  et: {
    preview: (name) => `Uus kontaktis\u00f5num kasutajalt ${name}`,
    title: "Uus kontaktis\u00f5num",
    nameLabel: "Nimi:",
    emailLabel: "E-post:",
    phoneLabel: "Telefon:",
    countryLabel: "Riik:",
    messageLabel: "S\u00f5num:",
    naValue: "Pole m\u00e4rgitud",
    footer: "\u00a9 2026 Planuojam. K\u00f5ik \u00f5igused kaitstud.",
  },
};

export const ContactEmail = ({
  firstName,
  lastName,
  email,
  phone,
  country,
  message,
  locale = "en",
}: ContactEmailProps) => {
  const t = strings[normalizeEmailSubjectLocale(locale)];
  const fullName = `${firstName} ${lastName || ""}`.trim();

  return (
    <Html>
      <Head />
      <Preview>{t.preview(fullName)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{t.title}</Heading>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              <strong>{t.nameLabel}</strong> {fullName}
            </Text>
            <Text style={paragraph}>
              <strong>{t.emailLabel}</strong> {email}
            </Text>
            <Text style={paragraph}>
              <strong>{t.phoneLabel}</strong> {phone || t.naValue}
            </Text>
            <Text style={paragraph}>
              <strong>{t.countryLabel}</strong> {country || t.naValue}
            </Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              <strong>{t.messageLabel}</strong>
            </Text>
            <Text style={messageBox}>
              {message}
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              {t.footer}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactEmail;

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

const content = {
  padding: "40px",
  color: "#333333",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 15px",
};

const messageBox = {
  fontSize: "15px",
  lineHeight: "1.6",
  backgroundColor: "#f9f9f9",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #eeeeee",
  whiteSpace: "pre-wrap" as const,
};

const hr = {
  borderColor: "#eeeeee",
  margin: "20px 0",
};

const footer = {
  backgroundColor: "#111111",
  padding: "30px 20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#999999",
  fontSize: "14px",
  margin: "5px 0",
};

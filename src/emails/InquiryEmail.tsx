import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { getEmailStrings } from "./emailI18n";

interface InquiryEmailProps {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  listingTitle?: string;
  locale?: string;
}

export const InquiryEmail = ({
  name,
  email,
  phone,
  message,
  listingTitle,
  locale = 'en',
}: InquiryEmailProps) => {
  const t = getEmailStrings(locale).inquiry;
  return (
    <Html>
      <Head />
      <Preview>{t.preview(name)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{t.title}</Heading>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              {t.intro(listingTitle || 'Planuojam')}
            </Text>

            <Section style={infoSection}>
              <Text style={paragraph}>
                <strong>{t.fromLabel}</strong> {name}
              </Text>
              <Text style={paragraph}>
                <strong>{t.emailLabel}</strong> {email}
              </Text>
              <Text style={paragraph}>
                <strong>{t.phoneLabel}</strong> {phone || t.naValue}
              </Text>
            </Section>

            <Hr style={hr} />
            <Text style={paragraph}>
              <strong>{t.messageLabel}</strong>
            </Text>
            <Text style={messageBox}>
              {message || t.noMessage}
            </Text>

            <Section style={btnContainer}>
              <Button style={button} href="https://planuojam.lt/profile/availability-inquiries">
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
};

export default InquiryEmail;

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
const paragraph = { fontSize: "16px", lineHeight: "1.6", margin: "0 0 15px" };
const infoSection = {
  backgroundColor: "#f9f9f9",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
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
const hr = { borderColor: "#eeeeee", margin: "20px 0" };
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
  boxShadow: "0 4px 15px rgba(204, 146, 47, 0.3)",
};
const footer = {
  backgroundColor: "#111111",
  padding: "30px 20px",
  textAlign: "center" as const,
};
const footerText = { color: "#999999", fontSize: "14px", margin: "5px 0" };

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

interface BookingEmailProps {
  username: string;
  listingTitle: string;
  bookingDate: string;
  locale?: string;
}

export const BookingEmail = ({
  username,
  listingTitle,
  bookingDate,
  locale = 'en',
}: BookingEmailProps) => {
  const t = getEmailStrings(locale).booking;
  return (
    <Html>
      <Head />
      <Preview>{t.preview(listingTitle)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{t.title}</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h2}>{t.greeting(username)}</Heading>
            <Text style={paragraph}>{t.body(listingTitle)}</Text>

            <Section style={infoSection}>
              <Text style={paragraph}>
                <strong>{t.listingLabel}</strong> {listingTitle}
              </Text>
              <Text style={paragraph}>
                <strong>{t.dateLabel}</strong> {bookingDate}
              </Text>
            </Section>

            <Section style={btnContainer}>
              <Button style={button} href="https://planuojam.lt/profile/bookings">
                {t.cta}
              </Button>
            </Section>

            <Hr style={hr} />
            <Text style={paragraph}>{t.support}</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingEmail;

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
const infoSection = {
  backgroundColor: "#f9f9f9",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #eeeeee",
};
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
const hr = { borderColor: "#eeeeee", margin: "20px 0" };
const footer = {
  backgroundColor: "#111111",
  padding: "30px 20px",
  textAlign: "center" as const,
};
const footerText = { color: "#999999", fontSize: "14px", margin: "5px 0" };

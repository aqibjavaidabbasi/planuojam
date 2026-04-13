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

interface ContactEmailProps {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  message: string;
}

export const ContactEmail = ({
  firstName,
  lastName,
  email,
  phone,
  country,
  message,
}: ContactEmailProps) => (
  <Html>
    <Head />
    <Preview>New Contact Message from {firstName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>New Contact Message</Heading>
        </Section>
        <Section style={content}>
          <Text style={paragraph}>
            <strong>Name:</strong> {firstName} {lastName}
          </Text>
          <Text style={paragraph}>
            <strong>Email:</strong> {email}
          </Text>
          <Text style={paragraph}>
            <strong>Phone:</strong> {phone || "N/A"}
          </Text>
          <Text style={paragraph}>
            <strong>Country:</strong> {country || "N/A"}
          </Text>
          <Hr style={hr} />
          <Text style={paragraph}>
            <strong>Message:</strong>
          </Text>
          <Text style={messageBox}>
            {message}
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>
            © 2026 Planuojam. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

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

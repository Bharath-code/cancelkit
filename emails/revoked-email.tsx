import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const revokedEmailSubject =
  "CancelKit's Stripe access was revoked — your widget is off";

export function RevokedEmail({ businessName }: { businessName: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your cancel button reverted to native behavior.</Preview>
      <Body style={{ backgroundColor: "#FAFAF9", fontFamily: "Inter, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E4E7",
            borderRadius: 12,
            margin: "40px auto",
            maxWidth: 480,
            padding: 32,
          }}
        >
          <Section>
            <Text style={{ color: "#16181D", fontSize: 18, fontWeight: 600, margin: 0 }}>
              Stripe access revoked for {businessName}
            </Text>
            <Text style={{ color: "#16181D", fontSize: 14, lineHeight: 1.6 }}>
              Someone disconnected CancelKit from your Stripe account, so the
              widget stopped serving immediately. Your cancel button works
              exactly as it did before CancelKit — nothing is broken, you&apos;re
              just not saving anyone.
            </Text>
            <Text style={{ color: "#16181D", fontSize: 14 }}>
              Reconnect any time: open CancelKit and click Connect Stripe —
              your settings and history are intact.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default RevokedEmail;

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function saveEmailSubject(customerLabel: string, amount: string) {
  return `You just saved ${customerLabel} — ${amount}/mo retained`;
}

export function SaveEmail({
  customerLabel,
  amount,
  planNickname,
  outcome,
  resumesAt,
}: {
  customerLabel: string;
  amount: string; // formatted, e.g. "$99"
  planNickname: string;
  outcome: "saved_pause" | "saved_coupon";
  resumesAt?: string; // formatted date for pauses
}) {
  return (
    <Html>
      <Head />
      <Preview>{`${customerLabel} stayed — ${amount}/mo retained`}</Preview>
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
            <Text style={{ color: "#0F9960", fontSize: 24, fontWeight: 700, margin: 0 }}>
              {amount}/mo retained
            </Text>
            <Text style={{ color: "#16181D", fontSize: 16, lineHeight: 1.6 }}>
              {customerLabel} clicked cancel on {planNickname} and took{" "}
              {outcome === "saved_pause"
                ? `the pause instead${resumesAt ? ` — billing resumes ${resumesAt}` : ""}`
                : "the discount instead"}
              . No action needed; this is just the good kind of email.
            </Text>
            <Text style={{ color: "#5C616B", fontSize: 12 }}>
              CancelKit — every claim is a number.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default SaveEmail;

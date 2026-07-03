import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function receiptSubject(saves: number, amount: string) {
  return saves > 0
    ? `${saves} save${saves === 1 ? "" : "s"}, ${amount} MRR retained last month`
    : "Last month's exit reasons";
}

export function MonthlyReceipt({
  saves,
  amount,
  multiple,
  reasonSummary,
}: {
  saves: number;
  amount: string; // formatted retained MRR
  multiple: string; // e.g. "8x" — retained vs what they paid us
  reasonSummary: { label: string; count: number }[];
}) {
  return (
    <Html>
      <Head />
      <Preview>
        {saves > 0
          ? `${amount} retained — ${multiple} what you paid us`
          : "No saves last month, but the exit reasons are yours."}
      </Preview>
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
          {saves > 0 ? (
            <Section>
              <Text style={{ color: "#0F9960", fontSize: 24, fontWeight: 700, margin: 0 }}>
                {saves} save{saves === 1 ? "" : "s"}, {amount} MRR retained
              </Text>
              <Text style={{ color: "#16181D", fontSize: 16 }}>
                That&apos;s {multiple} what you paid us last month.
              </Text>
            </Section>
          ) : (
            <Section>
              <Text style={{ color: "#16181D", fontSize: 18, fontWeight: 600, margin: 0 }}>
                No saves last month — here&apos;s why people left
              </Text>
              <Text style={{ color: "#5C616B", fontSize: 14 }}>
                Exit reasons on 100% of cancellations, even when nobody takes
                the offer:
              </Text>
            </Section>
          )}
          {reasonSummary.length > 0 && (
            <Section>
              {reasonSummary.map((r) => (
                <Text key={r.label} style={{ color: "#16181D", fontSize: 14, margin: "4px 0" }}>
                  {r.count} × {r.label}
                </Text>
              ))}
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export default MonthlyReceipt;

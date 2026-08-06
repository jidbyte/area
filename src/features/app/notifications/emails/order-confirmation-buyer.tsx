import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type OrderConfirmationBuyerEmailProps = {
  shopName: string;
  buyerName: string;
  saleNumber: string;
  currency: string;
  items: Array<{ name: string; quantity: number; subtotal: number }>;
  total: number;
};

export function OrderConfirmationBuyerEmail({
  shopName,
  buyerName,
  saleNumber,
  currency,
  items,
  total,
}: OrderConfirmationBuyerEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your order {saleNumber} from {shopName} is confirmed
      </Preview>
      <Body style={{ backgroundColor: "#f5f9fe", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 8,
            padding: 32,
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          <Heading style={{ color: "#0a2f61", fontSize: 20 }}>
            Thanks, {buyerName}!
          </Heading>
          <Text style={{ color: "#334155" }}>
            Your order from <strong>{shopName}</strong> is confirmed.
          </Text>
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Order {saleNumber}
          </Text>

          <Hr style={{ borderColor: "#d4e5f9" }} />

          {items.map((item) => (
            <Section key={item.name} style={{ marginBottom: 8 }}>
              <Text style={{ margin: 0, color: "#334155", fontSize: 14 }}>
                {item.name} × {item.quantity}
                <span style={{ float: "right" }}>
                  {currency} {item.subtotal.toLocaleString()}
                </span>
              </Text>
            </Section>
          ))}

          <Hr style={{ borderColor: "#d4e5f9" }} />

          <Text style={{ color: "#0a2f61", fontSize: 16, fontWeight: 700 }}>
            Total
            <span style={{ float: "right" }}>
              {currency} {total.toLocaleString()}
            </span>
          </Text>

          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 24 }}>
            The shop will be in touch about delivery. Reply to this email if you
            have questions about your order.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationBuyerEmail;

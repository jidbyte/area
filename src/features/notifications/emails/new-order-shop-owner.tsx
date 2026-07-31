import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type NewOrderShopOwnerEmailProps = {
  shopSlug: string;
  saleNumber: string;
  saleId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  currency: string;
  items: Array<{ name: string; quantity: number; subtotal: number }>;
  total: number;
  appUrl: string;
};

export function NewOrderShopOwnerEmail({
  shopSlug,
  saleNumber,
  saleId,
  buyerName,
  buyerEmail,
  buyerPhone,
  currency,
  items,
  total,
  appUrl,
}: NewOrderShopOwnerEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New order {saleNumber} — {currency} {total.toLocaleString()}
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
            New order: {saleNumber}
          </Heading>
          <Text style={{ color: "#334155" }}>
            {buyerName} just placed an order for {currency}{" "}
            {total.toLocaleString()}.
          </Text>

          <Section style={{ marginTop: 16, marginBottom: 16 }}>
            <Text style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
              Buyer contact
            </Text>
            <Text style={{ margin: 0, color: "#334155", fontSize: 14 }}>
              {buyerEmail}
            </Text>
            <Text style={{ margin: 0, color: "#334155", fontSize: 14 }}>
              {buyerPhone}
            </Text>
          </Section>

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

          <Link
            href={`${appUrl}/admin/sales/${saleId}`}
            style={{
              display: "inline-block",
              marginTop: 24,
              backgroundColor: "#1567d4",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: 6,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View order
          </Link>

          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 24 }}>
            Manage this and every order at /{shopSlug} in your AREA dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default NewOrderShopOwnerEmail;

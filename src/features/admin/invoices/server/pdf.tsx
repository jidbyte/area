import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  shopName: { fontSize: 18, fontWeight: 700 },
  invoiceTitle: { fontSize: 20, fontWeight: 700, textAlign: "right" },
  muted: { color: "#5D5D5D" },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  table: { marginTop: 12, borderTop: "1px solid #dbeafe" },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #dbeafe",
    paddingVertical: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 6,
    fontWeight: 700,
    backgroundColor: "#f8fafc",
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colSubtotal: { flex: 1, textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", gap: 24, marginBottom: 4 },
  totalsLabel: { width: 100, textAlign: "right" },
  totalsValue: { width: 80, textAlign: "right" },
  grandTotal: { fontSize: 13, fontWeight: 700 },
  notes: { marginTop: 24, paddingTop: 12, borderTop: "1px solid #dbeafe" },
});

export type InvoicePdfData = {
  shopName: string;
  shopEmail: string | null;
  shopPhone: string | null;
  shopAddress: string | null;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
};

function money(amount: number, currency: string) {
  // Kept dependency-free (no Intl locale assumptions) since this renders
  // server-side for a PDF, not in a browser with the user's own locale.
  return `${currency} ${amount.toLocaleString()}`;
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{data.shopName}</Text>
            {data.shopAddress && <Text style={styles.muted}>{data.shopAddress}</Text>}
            {data.shopEmail && <Text style={styles.muted}>{data.shopEmail}</Text>}
            {data.shopPhone && <Text style={styles.muted}>{data.shopPhone}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.muted}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.muted}>Bill to</Text>
            <Text style={styles.muted}>Issue date</Text>
          </View>
          <View style={styles.row}>
            <Text>{data.customerName}</Text>
            <Text>{data.issueDate.toLocaleDateString()}</Text>
          </View>
          {data.customerEmail && (
            <View style={styles.row}>
              <Text style={styles.muted}>{data.customerEmail}</Text>
              {data.dueDate && <Text style={styles.muted}>Due {data.dueDate.toLocaleDateString()}</Text>}
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit price</Text>
            <Text style={styles.colSubtotal}>Subtotal</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{money(item.unitPrice, data.currency)}</Text>
              <Text style={styles.colSubtotal}>{money(item.subtotal, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{money(data.subtotal, data.currency)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>-{money(data.discountAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, styles.grandTotal]}>Total</Text>
            <Text style={[styles.totalsValue, styles.grandTotal]}>
              {money(data.totalAmount, data.currency)}
            </Text>
          </View>
        </View>

        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.muted}>{data.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

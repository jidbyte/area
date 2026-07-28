import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformAdminOverviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Platform admin</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shops</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Approve pending shops, or suspend active ones.{" "}
            <Link href="/admin/shops" className="text-primary underline">
              Manage shops
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

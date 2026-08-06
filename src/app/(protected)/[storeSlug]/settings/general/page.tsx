import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ThemeSelector } from "@/features/admin/shared/client/theme-selector";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral">
            Choose how the dashboard looks on this device.
          </p>
          <ThemeSelector />
        </CardContent>
      </Card>
    </div>
  );
}

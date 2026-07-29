import { Card, CardContent } from "@/shared/components/ui/card";

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="text-muted-foreground text-sm">{note}</CardContent>
      </Card>
    </div>
  );
}

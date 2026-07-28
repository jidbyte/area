import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{siteConfig.name}</CardTitle>
          <CardDescription>{siteConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Project setup complete</Button>
        </CardContent>
      </Card>
    </div>
  );
}

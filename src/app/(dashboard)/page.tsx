import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostAuthDemo } from "@/components/post-auth-demo";

export default function DashboardHomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visão geral do painel. Conteúdo de negócio será adicionado nas próximas
          etapas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Boas-vindas</CardTitle>
          <CardDescription>
            Boilerplate pronto: layout, tema, estado global e rotas base.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <PostAuthDemo />
        </CardContent>
      </Card>
    </div>
  );
}

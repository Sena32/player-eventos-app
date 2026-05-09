import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Listagem e gestão de eventos — em breve.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
          <CardDescription>
            Esta área receberá listagem, filtros e ações quando as features forem
            implementadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhuma integração com API ou CRUD neste boilerplate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

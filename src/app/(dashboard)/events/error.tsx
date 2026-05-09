"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Algo deu errado</CardTitle>
          <CardDescription>
            Não foi possível carregar esta seção. Tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => reset()}>
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

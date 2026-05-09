import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground text-center text-sm">
        O recurso solicitado não existe ou foi movido.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Voltar ao início
      </Link>
    </div>
  );
}

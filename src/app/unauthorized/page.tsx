import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold">Acesso nao autorizado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta conta nao possui acesso ao Eeytech Admin.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/login">Voltar para login</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Tentar novamente</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

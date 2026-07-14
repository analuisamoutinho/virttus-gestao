import { TextField } from "@/components/ui/form";
import { Button } from "@/components/ui";

export function LocalLoginForm({ error }: { error?: string }) {
  return (
    <form action="/api/local-login" method="POST" className="flex flex-col gap-3 text-left">
      <TextField label="Seu nome" name="name" placeholder="Ana Líder" required />
      <TextField label="Seu e-mail" name="email" type="email" placeholder="voce@empresa.com" required />
      <TextField label="Senha de acesso" name="password" type="password" required />
      {error === "email" ? <p className="text-sm text-red-600">Informe um e-mail.</p> : null}
      {error === "password" ? <p className="text-sm text-red-600">Senha incorreta.</p> : null}
      <Button type="submit" className="w-full">
        Entrar
      </Button>
      <p className="text-center text-xs text-muted">
        Login simplificado — sem Google OAuth. Use sempre o mesmo e-mail para voltar à sua conta.
      </p>
    </form>
  );
}

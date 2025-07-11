import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando formulário...</div>}>
      <LoginForm />
    </Suspense>
  );
}

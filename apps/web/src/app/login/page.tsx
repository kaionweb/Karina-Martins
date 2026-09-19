"use client";

import { Suspense, useId, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "@/lib/auth";
import { BrandGlow } from "@/components/decorative/brand-glow";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push("/select-profile");
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-cinema-bg p-4 font-body text-cinema-text sm:p-6">
      <BrandGlow />

      <div className="pointer-events-none absolute right-10 top-16 hidden lg:block">
        <div className="animate-float-a opacity-40">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cinema-primary/70 to-cinema-primary-alt/70 blur-[1px]">
            <span className="text-2xl">🦊</span>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-20 left-10 hidden lg:block">
        <div className="animate-float-a opacity-30" style={{ animationDelay: "1s" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B]/70 to-cinema-amber/70 blur-[1px]">
            <span className="text-xl">🦁</span>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 w-full max-w-md animate-fade-in-up rounded-3xl border border-cinema-border bg-cinema-surface/90 p-6 shadow-cinema-elevated backdrop-blur-xl sm:p-8"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="Colégio Karina Martins" className="h-20 w-auto object-contain" />
          </div>
        </div>

        <div className="mb-7 text-center">
          <h1 className="mb-2 font-display text-2xl font-bold text-cinema-text sm:text-3xl">Bem-vindo de volta</h1>
          <p className="font-body text-sm text-cinema-muted">A aventura continua de onde parou</p>
        </div>

        {justRegistered ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-cinema-green/30 bg-cinema-green/10 px-3 py-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cinema-green" />
            <span className="font-body text-xs font-semibold text-cinema-green">
              Conta criada! Faça login para continuar.
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 flex animate-shake items-start gap-2 rounded-xl border border-[#DA233B]/30 bg-[#DA233B]/10 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#DA233B]" />
            <span className="font-body text-xs font-semibold text-[#DA233B]">{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            icon={<Mail className="h-4 w-4" />}
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <div>
            <FormField
              icon={<Lock className="h-4 w-4" />}
              label="Senha"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-cinema-muted transition-colors hover:text-cinema-text"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="font-body text-xs font-bold text-cinema-muted transition-colors hover:text-cinema-primary"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-cinema-lg bg-gradient-to-r from-cinema-primary via-cinema-primary-alt to-cinema-primary bg-[length:200%_100%] bg-left px-6 py-3.5 font-display text-base font-bold text-white shadow-cinema-glow transition-[background-position,transform] duration-500 hover:scale-[1.01] hover:bg-right active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Entrando…</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <Divider />

        <a
          href={`${API_URL}/auth/google`}
          className="group flex w-full items-center justify-center gap-3 rounded-cinema-lg border border-[#D5DCE6] bg-white px-6 py-3.5 font-display text-sm font-semibold text-neutral-800 shadow-[0_4px_12px_-2px_rgba(45,101,174,0.12)] transition-all hover:scale-[1.01] hover:bg-neutral-50 active:scale-[0.99]"
        >
          <GoogleLogo />
          <span>Continuar com Google</span>
        </a>

        <div className="mt-6 text-center">
          <span className="font-body text-sm text-cinema-muted">Não tem conta? </span>
          <Link href="/register" className="font-display text-sm font-bold text-[#DA233B] transition-colors hover:text-[#DA233B]/80">
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <LoginForm />
    </Suspense>
  );
}

function FormField({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  rightSlot,
  autoComplete,
}: {
  icon: ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rightSlot?: ReactNode;
  autoComplete?: string;
}) {
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-cinema-muted">
        {label}
      </label>
      <div className="group flex items-center rounded-xl border border-cinema-border bg-cinema-surface-alt transition-all focus-within:border-cinema-primary/50 focus-within:bg-cinema-surface focus-within:ring-4 focus-within:ring-cinema-primary/10">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-cinema-muted transition-colors group-focus-within:text-cinema-primary">
          {icon}
        </div>
        <input
          id={inputId}
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 flex-1 bg-transparent pr-3 font-body text-sm font-semibold text-cinema-text placeholder-cinema-muted/60 outline-none"
        />
        {rightSlot ? <div className="pr-1.5">{rightSlot}</div> : null}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-cinema-border" />
      <span className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-cinema-muted">ou</span>
      <div className="h-px flex-1 bg-cinema-border" />
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

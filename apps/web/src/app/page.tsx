"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bot, Check, Sparkles, Trophy } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { BrandGlow } from "@/components/decorative/brand-glow";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const accessToken = await getAccessToken();
      if (accessToken) {
        router.replace("/select-profile");
        return;
      }
      setChecked(true);
    }

    checkSession();
  }, [router]);

  if (!checked) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-cinema-bg font-body text-cinema-text md:flex-row">
      <BrandGlow />

      <HeroVisual />
      <Content />
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative flex h-[45vh] items-center justify-center overflow-hidden md:h-screen md:w-1/2 md:flex-shrink-0">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cinema-primary/20 via-cinema-primary-alt/15 to-transparent blur-2xl" />
      </div>

      <div className="relative h-72 w-72 animate-fade-in md:h-96 md:w-96" style={{ animationDelay: "0.2s" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative flex h-40 w-40 animate-float-a items-center justify-center rounded-full shadow-cinema-orb md:h-52 md:w-52"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgb(71 153 193) 0%, rgb(45 101 174) 60%, rgb(20 40 70) 100%)",
              boxShadow: "0 0 60px rgb(45 101 174 / 0.4), inset -20px -20px 40px rgb(0 0 0 / 0.25)",
            }}
          >
            <div className="absolute h-56 w-56 rounded-full border-2 border-white/40 [transform:rotateX(75deg)] md:h-72 md:w-72" />
            <div className="absolute h-60 w-60 rounded-full border border-cinema-primary-alt/40 [transform:rotateX(75deg)] md:h-80 md:w-80" />

            <div className="absolute left-8 top-6 h-4 w-8 rounded-full bg-black/25" />
            <div className="absolute bottom-10 right-6 h-6 w-10 rounded-full bg-black/20" />
            <div className="absolute right-10 top-16 h-3 w-5 rounded-full bg-black/25" />
          </div>
        </div>

        <div className="absolute inset-0 animate-orbit-medium">
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607] md:h-20 md:w-20"
              style={{ boxShadow: "0 10px 30px -5px rgb(218 35 59 / 0.5), 0 0 0 4px rgb(247 249 252 / 0.9)" }}
            >
              <span className="text-3xl md:text-4xl">🦊</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cinema-primary to-cinema-primary-alt md:h-20 md:w-20"
              style={{ boxShadow: "0 10px 30px -5px rgb(45 101 174 / 0.5), 0 0 0 4px rgb(247 249 252 / 0.9)" }}
            >
              <span className="text-3xl md:text-4xl">🦁</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-8 animate-orbit-reverse">
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 rounded-full bg-cinema-primary" style={{ boxShadow: "0 0 12px rgb(45 101 174 / 0.8)" }} />
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="h-2 w-2 rounded-full bg-[#4799C1]" style={{ boxShadow: "0 0 10px rgb(71 153 193 / 0.8)" }} />
          </div>
        </div>

        <div className="absolute -right-4 -top-6 animate-launch md:-right-8 md:-top-8">
          <div className="relative">
            <div
              className="absolute -bottom-4 left-1/2 h-16 w-2 -translate-x-1/2 rounded-full opacity-70 blur-sm"
              style={{
                background: "linear-gradient(to top, transparent, rgb(218 35 59), rgb(251 198 7))",
                transform: "translateX(8px) rotate(-25deg)",
                transformOrigin: "top center",
              }}
            />
            <div className="flex h-14 w-14 items-center justify-center text-4xl md:h-16 md:w-16 md:text-5xl">🚀</div>
          </div>
        </div>

        <div className="absolute -left-4 top-8 animate-float-b">
          <Sparkles className="h-5 w-5 text-cinema-amber drop-shadow-[0_0_8px_rgb(251_198_7_/_0.6)]" />
        </div>
        <div className="absolute -right-2 bottom-12 animate-float-a">
          <Sparkles className="h-4 w-4 text-[#4799C1] drop-shadow-[0_0_8px_rgb(71_153_193_/_0.6)]" />
        </div>
        <div className="absolute -left-8 bottom-4 animate-float-b">
          <Sparkles className="h-6 w-6 text-[#DA233B] drop-shadow-[0_0_8px_rgb(218_35_59_/_0.6)]" />
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-8">
        <div
          className="h-1 w-16 animate-shooting rounded-full"
          style={{ background: "linear-gradient(to left, rgb(45 101 174), transparent)", animationDelay: "3s" }}
        />
      </div>
    </div>
  );
}

function Content() {
  return (
    <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-12 pt-6 md:px-12 md:py-16 lg:px-16">
      <div className="mx-auto w-full max-w-md md:mx-0">
        <div
          className="mb-6 flex animate-fade-in-up items-center justify-center gap-2"
          style={{ animationDelay: "0.3s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Colégio Karina Martins" className="h-16 w-auto object-contain" />
        </div>

        <h1
          className="mb-5 animate-fade-in-up font-display text-4xl font-bold leading-[1.05] text-cinema-text md:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.4s" }}
        >
          Onde aprender inglês vira{" "}
          <span className="bg-gradient-to-br from-cinema-primary to-cinema-primary-alt bg-clip-text text-transparent">
            aventura
          </span>
          .
        </h1>

        <p
          className="mb-8 animate-fade-in-up font-body text-base leading-relaxed text-cinema-muted md:text-lg"
          style={{ animationDelay: "0.5s" }}
        >
          Shows originais, gamificação e uma tutora de IA que conversa com seu filho. Feito pra crianças de{" "}
          <strong className="font-extrabold text-cinema-text">2 a 5 anos</strong>.
        </p>

        <div className="mb-10 animate-fade-in-up space-y-3" style={{ animationDelay: "0.6s" }}>
          <Pillar
            icon={<Sparkles className="h-4 w-4" />}
            iconColor="text-cinema-amber"
            iconBg="bg-cinema-amber/15 border-cinema-amber/25"
            title="Shows originais"
            desc="Séries pensadas pra aprender brincando"
          />
          <Pillar
            icon={<Trophy className="h-4 w-4" />}
            iconColor="text-[#DA233B]"
            iconBg="bg-[#DA233B]/15 border-[#DA233B]/25"
            title="XP, medalhas e ranking"
            desc="Sua criança quer voltar todo dia"
          />
          <Pillar
            icon={<Bot className="h-4 w-4" />}
            iconColor="text-cinema-primary-alt"
            iconBg="bg-cinema-primary-alt/15 border-cinema-primary-alt/25"
            title="Tutora de IA em inglês"
            desc="Conversa e tira dúvidas 24h"
          />
        </div>

        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "0.7s" }}>
          <Link
            href="/register"
            className="group relative flex w-full animate-glow-pulse items-center justify-center gap-2 rounded-cinema-lg bg-gradient-to-r from-cinema-primary via-cinema-primary-alt to-cinema-primary bg-[length:200%_100%] bg-left px-6 py-4 font-display text-base font-bold text-white transition-[background-position,transform] duration-500 hover:scale-[1.02] hover:bg-right active:scale-[0.99]"
          >
            <span>Criar conta grátis</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>

          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-cinema-lg border border-cinema-primary/25 bg-cinema-primary/5 px-6 py-4 font-display text-base font-semibold text-cinema-primary transition-colors hover:border-cinema-primary/40 hover:bg-cinema-primary/10"
          >
            Já tenho conta
          </Link>

          <Link
            href="/explorar"
            className="flex w-full items-center justify-center rounded-cinema-lg px-6 py-3 font-body text-sm font-semibold text-cinema-muted underline-offset-2 transition-colors hover:text-cinema-text hover:underline"
          >
            Só quero dar uma olhada, sem criar conta
          </Link>
        </div>

        <div className="mt-6 flex animate-fade-in-up flex-wrap items-center gap-x-4 gap-y-2" style={{ animationDelay: "0.8s" }}>
          <TrustItem>7 dias grátis</TrustItem>
          <TrustItem>Sem cartão de crédito</TrustItem>
          <TrustItem>Cancele quando quiser</TrustItem>
        </div>
      </div>
    </div>
  );
}

function Pillar({
  icon,
  iconColor,
  iconBg,
  title,
  desc,
}: {
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold text-cinema-text">{title}</div>
        <div className="font-body text-xs text-cinema-muted">{desc}</div>
      </div>
    </div>
  );
}

function TrustItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-4 w-4 items-center justify-center rounded-full border border-cinema-green/30 bg-cinema-green/15">
        <Check className="h-2.5 w-2.5 text-cinema-green" strokeWidth={3.5} />
      </div>
      <span className="font-body text-xs font-semibold text-cinema-muted">{children}</span>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Flame, Search, SlidersHorizontal, Home, Compass,
  Gamepad2, Sparkles, User, Play, Mic, Headphones, MessageCircle,
  Film, Tv, Star, Trophy, Medal, Send, ChevronRight, Crown, Bot
} from "lucide-react";

/* ============================================================
   METODOLOGIA CONECTADA — Layout do app (Karina Martins)
   Tema: "Cinema em casa" — escuro, vermelho vibrante, luz de projetor.
   Todos os cards de conteúdo são artes tipográficas ORIGINAIS
   (sem IP de terceiros), conforme o plano do sistema.
   ============================================================ */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Sora:wght@300;400;500;600;700&display=swap');

:root{
  --bg:#0B0C10; --surface:#14161D; --surface-2:#1B1E28; --line:#262A36;
  --text:#F4F5F7; --muted:#8A90A0;
  --primary:#E8332A; --primary-2:#FF6B4A;
  --amber:#FFB23E; --blue:#4C8DFF; --green:#3ECF8E;
}
*{box-sizing:border-box}
.app-root{
  min-height:100vh; width:100%;
  background:
    radial-gradient(900px 500px at 15% -10%, rgba(232,51,42,.16), transparent 60%),
    radial-gradient(700px 420px at 90% 110%, rgba(255,178,62,.10), transparent 55%),
    #07080B;
  display:flex; align-items:center; justify-content:center;
  padding:32px 16px; font-family:'Sora',sans-serif; color:var(--text);
}
.filmstrip{
  position:fixed; inset:0; pointer-events:none; opacity:.05;
  background-image:repeating-linear-gradient(90deg, transparent 0 46px, #fff 46px 48px);
}
.phone{
  position:relative; width:100%; max-width:392px; height:min(844px, 92vh);
  background:var(--bg); border-radius:44px; overflow:hidden;
  border:1px solid #23252e;
  box-shadow:0 40px 90px -30px rgba(0,0,0,.85), 0 0 0 8px #101116,
             0 0 120px -40px rgba(232,51,42,.45);
  display:flex; flex-direction:column;
}
.projector{
  position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(420px 260px at 50% -60px, rgba(232,51,42,.22), transparent 70%);
}
.screen{flex:1; overflow-y:auto; scrollbar-width:none; position:relative}
.screen::-webkit-scrollbar{display:none}
.pad{padding:0 20px}

.display{font-family:'Bricolage Grotesque',sans-serif}
.eyebrow{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-weight:600}

.card{background:var(--surface); border:1px solid var(--line); border-radius:20px}
.chip{
  padding:9px 15px; border-radius:999px; font-size:13px; font-weight:500;
  background:var(--surface-2); border:1px solid var(--line); color:var(--muted);
  cursor:pointer; white-space:nowrap; transition:all .2s;
}
.chip.on{
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  color:#fff; border-color:transparent; font-weight:600;
  box-shadow:0 6px 18px -6px rgba(232,51,42,.6);
}
.hide-scroll{scrollbar-width:none} .hide-scroll::-webkit-scrollbar{display:none}

.flame-glow{filter:drop-shadow(0 0 10px rgba(255,120,50,.75)); animation:flame 2.2s ease-in-out infinite}
@keyframes flame{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}

.poster{
  position:relative; border-radius:18px; overflow:hidden; cursor:pointer;
  border:1px solid rgba(255,255,255,.08); flex-shrink:0;
}
.poster .grain{
  position:absolute; inset:0; opacity:.35; mix-blend-mode:overlay;
  background-image:radial-gradient(rgba(255,255,255,.28) .5px, transparent .5px);
  background-size:4px 4px;
}
.poster .spot{
  position:absolute; inset:0;
  background:radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,.22), transparent 55%);
}
.level-tag{
  font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:4px 9px; border-radius:999px; background:rgba(0,0,0,.45);
  backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,.18);
}
.nav{
  display:flex; justify-content:space-around; align-items:flex-end;
  padding:10px 8px calc(14px + env(safe-area-inset-bottom)); position:relative;
  background:rgba(11,12,16,.9); backdrop-filter:blur(14px);
  border-top:1px solid var(--line);
}
.nav-btn{
  display:flex; flex-direction:column; align-items:center; gap:4px;
  background:none; border:none; color:var(--muted); font-size:10.5px;
  font-family:'Sora',sans-serif; font-weight:500; cursor:pointer; width:64px;
  transition:color .2s; padding:0;
}
.nav-btn.on{color:var(--primary-2)}
.ia-orb{
  width:52px; height:52px; border-radius:18px; margin-top:-26px;
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  display:flex; align-items:center; justify-content:center; color:#fff;
  box-shadow:0 12px 26px -8px rgba(232,51,42,.7), inset 0 1px 0 rgba(255,255,255,.35);
}
.bubble{max-width:80%; padding:12px 15px; border-radius:18px; font-size:13.5px; line-height:1.55}
.bubble.ai{background:var(--surface-2); border:1px solid var(--line); border-bottom-left-radius:6px}
.bubble.me{
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  color:#fff; border-bottom-right-radius:6px; margin-left:auto;
}
input.msg{
  flex:1; background:var(--surface-2); border:1px solid var(--line); border-radius:999px;
  padding:12px 18px; color:var(--text); font-family:'Sora',sans-serif; font-size:13.5px; outline:none;
}
input.msg:focus{border-color:rgba(232,51,42,.6)}
button:focus-visible,.chip:focus-visible{outline:2px solid var(--primary-2); outline-offset:2px}
@media (prefers-reduced-motion:reduce){ .flame-glow{animation:none} }
`;

/* ---------- dados de demonstração (conteúdo 100% original) ---------- */

const trilhas = [
  { titulo: "Risadas em Inglês", genero: "Comédia", nivel: "Intermediário", licoes: 18,
    bg: "linear-gradient(160deg,#FF8A3C 0%,#E8332A 55%,#8E1B4B 100%)" },
  { titulo: "Mistérios da Cidade", genero: "Suspense", nivel: "Avançado", licoes: 24,
    bg: "linear-gradient(160deg,#1B2A5B 0%,#123B5C 60%,#0A1A2E 100%)" },
  { titulo: "Mundo Animal", genero: "Infantil", nivel: "Básico", licoes: 12,
    bg: "linear-gradient(160deg,#3ECF8E 0%,#1E9E6A 55%,#0C4F38 100%)" },
];

const catalogo = [
  { titulo: "Pequenos Heróis", nivel: "Básico", bg: "linear-gradient(160deg,#4C8DFF,#2A3FB8)" },
  { titulo: "Fundo do Mar", nivel: "Básico", bg: "linear-gradient(160deg,#22B8CF,#14508A)" },
  { titulo: "Grandes Emoções", nivel: "Intermediário", bg: "linear-gradient(160deg,#FFB23E,#E8332A)" },
  { titulo: "Viagem no Tempo", nivel: "Avançado", bg: "linear-gradient(160deg,#6A5AE0,#22254A)" },
];

const categorias = [
  { nome: "Séries", icon: Tv, cor: "#4C8DFF" },
  { nome: "Filmes", icon: Film, cor: "#E8332A" },
  { nome: "Conversação", icon: MessageCircle, cor: "#3ECF8E" },
  { nome: "Pronúncia", icon: Mic, cor: "#FFB23E" },
  { nome: "Listening", icon: Headphones, cor: "#B06AF0" },
  { nome: "Games", icon: Gamepad2, cor: "#FF6B4A" },
  { nome: "IA", icon: Sparkles, cor: "#FF4D6D" },
  { nome: "Premium", icon: Crown, cor: "#FFD166" },
];

const stagger = { hidden: { opacity: 0, y: 16 }, show: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" } }) };

/* ============================ HOME ============================ */

function TelaHome() {
  return (
    <div className="pad" style={{ paddingTop: 22, paddingBottom: 28 }}>
      {/* header */}
      <motion.div custom={0} variants={stagger} initial="hidden" animate="show"
        style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 18, flexShrink: 0,
          background: "linear-gradient(135deg,#FFB23E,#E8332A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff",
          boxShadow: "0 8px 20px -6px rgba(232,51,42,.5)"
        }}>C</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.1 }}>
            Olá, Camila! <span aria-hidden>👋</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
            Nível 12 · Intermediário <span style={{ color: "var(--amber)" }}>🏅</span>
          </div>
        </div>
        <button aria-label="Notificações" style={{
          width: 42, height: 42, borderRadius: 14, background: "var(--surface)",
          border: "1px solid var(--line)", color: "var(--text)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}><Bell size={18} /></button>
      </motion.div>

      {/* streak + xp */}
      <motion.div custom={1} variants={stagger} initial="hidden" animate="show"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        <div className="card" style={{ padding: "16px 16px 14px" }}>
          <div className="eyebrow">Sequência</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div className="display" style={{ fontSize: 30, fontWeight: 700 }}>
              12<span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginLeft: 5 }}>dias</span>
            </div>
            <Flame size={26} className="flame-glow" style={{ color: "#FF7A3C" }} />
          </div>
        </div>
        <div className="card" style={{ padding: "16px 16px 14px" }}>
          <div className="eyebrow">XP total</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div className="display" style={{ fontSize: 30, fontWeight: 700 }}>2.450</div>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%,#FFE29A,#FFB23E 55%,#C97B12)",
              boxShadow: "0 0 14px rgba(255,178,62,.55)", flexShrink: 0
            }} aria-hidden />
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1", height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: "68%" }}
            transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,var(--primary),var(--amber))" }} />
        </div>
      </motion.div>

      {/* continue aprendendo */}
      <motion.div custom={2} variants={stagger} initial="hidden" animate="show"
        className="poster" style={{ marginTop: 22, background: trilhas[2].bg, width: "100%" }}>
        <div className="spot" /><div className="grain" />
        <div style={{ position: "relative", padding: "20px 20px 18px" }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.75)" }}>Continue aprendendo</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#fff", lineHeight: 1.05 }}>
            Aventura na Floresta
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)", marginTop: 4 }}>Trilha 1 · Lição 9 de 12</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#0B0C10",
              border: "none", borderRadius: 999, padding: "10px 20px", fontFamily: "'Sora',sans-serif",
              fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,.3)"
            }}><Play size={15} fill="#0B0C10" /> Continuar</button>
            <div style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(0,0,0,.35)", overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", background: "#fff", borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)", marginTop: 5, fontWeight: 600 }}>75% concluído</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* categorias */}
      <motion.div custom={3} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Categorias</h2>
          <button style={{ background: "none", border: "none", color: "var(--primary-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
            Ver todas <ChevronRight size={12} style={{ verticalAlign: -1 }} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 14 }}>
          {categorias.map(c => (
            <button key={c.nome} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 7
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 17, background: "var(--surface)",
                border: "1px solid var(--line)", display: "flex", alignItems: "center",
                justifyContent: "center", color: c.cor
              }}><c.icon size={21} /></div>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Sora',sans-serif" }}>{c.nome}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* trilhas em destaque — pôsteres tipográficos originais */}
      <motion.div custom={4} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Trilhas em destaque</h2>
          <button style={{ background: "none", border: "none", color: "var(--primary-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
            Ver todas <ChevronRight size={12} style={{ verticalAlign: -1 }} />
          </button>
        </div>
        <div className="hide-scroll" style={{ display: "flex", gap: 13, marginTop: 14, overflowX: "auto", paddingBottom: 6 }}>
          {trilhas.map(t => (
            <div key={t.titulo} className="poster" style={{ width: 148, height: 196, background: t.bg }}>
              <div className="spot" /><div className="grain" />
              <div style={{ position: "relative", height: "100%", padding: 13, display: "flex", flexDirection: "column" }}>
                <span className="level-tag" style={{ alignSelf: "flex-start", color: "#fff" }}>{t.nivel}</span>
                <div style={{ marginTop: "auto" }}>
                  <div className="display" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.05, color: "#fff" }}>{t.titulo}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.8)", marginTop: 5, fontWeight: 600 }}>
                    {t.genero} · {t.licoes} lições
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* jornada */}
      <motion.div custom={5} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 24 }}>
        <h2 className="display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Sua jornada</h2>
        <div className="card" style={{ marginTop: 13, padding: "16px 8px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { icon: Star, cor: "var(--amber)", valor: "2.450", label: "XP" },
            { icon: Medal, cor: "var(--primary-2)", valor: "14", label: "Medalhas" },
            { icon: Trophy, cor: "var(--blue)", valor: "3º", label: "Ranking" },
          ].map((s, i) => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              borderLeft: i ? "1px solid var(--line)" : "none"
            }}>
              <s.icon size={19} style={{ color: s.cor }} />
              <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>{s.valor}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ============================ EXPLORAR ============================ */

function TelaExplorar() {
  const [nivel, setNivel] = useState("Intermediário");
  const [genero, setGenero] = useState(null);
  const [skill, setSkill] = useState(null);
  const itens = catalogo.filter(c => !nivel || c.nivel === nivel || true); // demo: filtro visual

  return (
    <div className="pad" style={{ paddingTop: 22, paddingBottom: 28 }}>
      <motion.div custom={0} variants={stagger} initial="hidden" animate="show"
        style={{ display: "flex", gap: 10 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--surface)",
          border: "1px solid var(--line)", borderRadius: 999, padding: "12px 16px"
        }}>
          <Search size={16} style={{ color: "var(--muted)" }} />
          <input placeholder="Buscar séries, filmes, lições…" style={{
            background: "none", border: "none", outline: "none", color: "var(--text)",
            fontFamily: "'Sora',sans-serif", fontSize: 13.5, width: "100%"
          }} />
        </div>
        <button aria-label="Filtros avançados" style={{
          width: 46, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line)",
          color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}><SlidersHorizontal size={17} /></button>
      </motion.div>

      {[
        { label: "Nível", opts: ["Básico", "Intermediário", "Avançado"], val: nivel, set: setNivel },
        { label: "Gênero", opts: ["Comédia", "Romance", "Suspense", "Infantil"], val: genero, set: setGenero },
        { label: "Habilidade", opts: ["Listening", "Vocabulary", "Speaking"], val: skill, set: setSkill },
      ].map((g, gi) => (
        <motion.div key={g.label} custom={gi + 1} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 18 }}>
          <div className="eyebrow">{g.label}</div>
          <div className="hide-scroll" style={{ display: "flex", gap: 9, marginTop: 10, overflowX: "auto" }}>
            {g.opts.map(o => (
              <button key={o} className={`chip ${g.val === o ? "on" : ""}`}
                onClick={() => g.set(g.val === o ? null : o)}>{o}</button>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div custom={4} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 24 }}>
        <h2 className="display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Em destaque</h2>
        <div className="poster" style={{ marginTop: 13, height: 172, background: trilhas[1].bg, width: "100%" }}>
          <div className="spot" /><div className="grain" />
          <div style={{ position: "relative", height: "100%", padding: 18, display: "flex", flexDirection: "column" }}>
            <span className="level-tag" style={{ alignSelf: "flex-start", color: "#fff" }}>Intermediário · 24 lições</span>
            <div style={{ marginTop: "auto" }}>
              <div className="display" style={{ fontSize: 27, fontWeight: 800, color: "#fff", lineHeight: 1.02 }}>
                Mistérios<br />da Cidade
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 5, fontWeight: 600 }}>
                Suspense · nova temporada
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div custom={5} variants={stagger} initial="hidden" animate="show" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Todos os conteúdos</h2>
          <button style={{ background: "none", border: "none", color: "var(--primary-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>Ver todos</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 13, marginTop: 14 }}>
          {itens.map(c => (
            <div key={c.titulo} className="poster" style={{ height: 150, background: c.bg }}>
              <div className="spot" /><div className="grain" />
              <div style={{ position: "relative", height: "100%", padding: 13, display: "flex", flexDirection: "column" }}>
                <span className="level-tag" style={{ alignSelf: "flex-start", color: "#fff" }}>{c.nivel}</span>
                <div className="display" style={{ marginTop: "auto", fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>
                  {c.titulo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ============================ TUTOR IA ============================ */

const respostasDemo = [
  "Great answer! 🎉 Now try this one: how would you say \"Eu assisto séries todos os dias\" in English?",
  "Almost there! A more natural way is: \"I watch series every day.\" Want to practice the pronunciation next?",
  "Perfect! You earned +5 XP for today's practice. Shall we review the vocabulary from \"Aventura na Floresta\"? 🌲",
];

function TelaIA() {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Hi Camila! I'm Kai, your English tutor. 👋 Ready to practice? Tell me: what did you do today?" },
    { role: "me", text: "I play with my dog in the park!" },
    { role: "ai", text: "Nice! Small tip: we say \"I played with my dog\" — past tense. You were great! ⭐" },
  ]);
  const [texto, setTexto] = useState("");
  const [digitando, setDigitando] = useState(false);
  const idx = useRef(0);
  const fim = useRef(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, digitando]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || digitando) return;
    setMsgs(m => [...m, { role: "me", text: t }]);
    setTexto("");
    setDigitando(true);
    setTimeout(() => {
      setMsgs(m => [...m, { role: "ai", text: respostasDemo[idx.current % respostasDemo.length] }]);
      idx.current += 1;
      setDigitando(false);
    }, 1100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pad" style={{ paddingTop: 20, paddingBottom: 14, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="ia-orb" style={{ width: 44, height: 44, marginTop: 0, borderRadius: 15 }}><Bot size={21} /></div>
        <div>
          <div className="display" style={{ fontSize: 16.5, fontWeight: 700 }}>Teacher Kai</div>
          <div style={{ fontSize: 11.5, color: "var(--green)", fontWeight: 600 }}>● Conversação em inglês</div>
        </div>
        <span className="level-tag" style={{ marginLeft: "auto", color: "var(--text)", background: "var(--surface-2)", borderColor: "var(--line)" }}>+5 XP/dia</span>
      </div>

      <div className="pad screen" style={{ flex: 1, paddingTop: 18, paddingBottom: 12, display: "flex", flexDirection: "column", gap: 11 }}>
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className={`bubble ${m.role === "ai" ? "ai" : "me"}`}>{m.text}</motion.div>
        ))}
        {digitando && (
          <div className="bubble ai" style={{ color: "var(--muted)", fontStyle: "italic" }}>Kai está digitando…</div>
        )}
        <div ref={fim} />
      </div>

      <div className="pad" style={{ paddingTop: 10, paddingBottom: 14, display: "flex", gap: 9, borderTop: "1px solid var(--line)" }}>
        <input className="msg" value={texto} placeholder="Responda em inglês…"
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviar()} />
        <button onClick={enviar} aria-label="Enviar mensagem" style={{
          width: 46, height: 46, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,var(--primary),var(--primary-2))", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 18px -6px rgba(232,51,42,.6)"
        }}><Send size={17} /></button>
      </div>
    </div>
  );
}

/* ============================ SHELL ============================ */

export default function App() {
  const [tab, setTab] = useState("home");

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "explorar", label: "Explorar", icon: Compass },
    { id: "ia", label: "IA", icon: Sparkles, orb: true },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "perfil", label: "Perfil", icon: User },
  ];

  return (
    <div className="app-root">
      <style>{css}</style>
      <div className="filmstrip" aria-hidden />
      <div className="phone">
        <div className="projector" aria-hidden />
        {tab === "ia" ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}><TelaIA /></div>
        ) : (
          <div className="screen">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>
                {tab === "home" && <TelaHome />}
                {tab === "explorar" && <TelaExplorar />}
                {(tab === "games" || tab === "perfil") && (
                  <div style={{ padding: "120px 32px", textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>Em breve ✨</div>
                    <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>
                      Esta área chega nas próximas fases do projeto. Volte para a Home e continue sua trilha!
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <nav className="nav" aria-label="Navegação principal">
          {tabs.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              {t.orb
                ? <span className="ia-orb"><t.icon size={22} /></span>
                : <t.icon size={21} strokeWidth={tab === t.id ? 2.4 : 1.9} />}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

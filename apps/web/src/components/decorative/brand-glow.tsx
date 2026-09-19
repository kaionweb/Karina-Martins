// Substitui o <StarField /> (tema escuro/espacial) no branch rebrand/karina-martins.
// Blobs suaves nas cores da marca, opacidade baixa — não faz sentido estrela
// num tema claro de colégio. Ver REBRAND_BRIEF.md do cliente.
export function BrandGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/4 h-[400px] w-[400px] rounded-full bg-[#4799C1] opacity-10 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[350px] w-[350px] rounded-full bg-[#FBC607] opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 -left-20 h-[300px] w-[300px] rounded-full bg-[#2D65AE] opacity-10 blur-3xl" />
    </div>
  );
}

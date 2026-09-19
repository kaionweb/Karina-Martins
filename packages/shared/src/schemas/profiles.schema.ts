import { z } from "zod";

export const CreateChildProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(60),
  ageRange: z.string().trim().min(1).max(20).nullable().optional(),
});

export type CreateChildProfileInput = z.infer<typeof CreateChildProfileSchema>;

// Só perfis ADULT podem ter foto (CLAUDE.md — REGRAS DE DOMÍNIO: perfis CHILD
// coletam apenas apelido + faixa etária, sem foto). `avatarUrl: null` remove a
// foto atual. Sem upload de arquivo — é só um link pra uma imagem já hospedada
// em outro lugar, então não há infraestrutura de storage nova a configurar.
export const UpdateProfileAvatarSchema = z.object({
  avatarUrl: z.string().trim().url().max(2048).nullable(),
});

export type UpdateProfileAvatarInput = z.infer<typeof UpdateProfileAvatarSchema>;

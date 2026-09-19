import { z } from "zod";

// Cenários curados da tela de Conversação — nunca texto livre do cliente,
// pra manter a regra de domínio "perfil CHILD só conversa dentro de um tema
// restrito" mesmo fora do universo de uma lição real do banco.
export const CONVERSATION_SCENARIOS = [
  "No Supermercado",
  "Fazendo Amigos",
  "Na Escola",
  "Pedindo Comida",
  "No Parque",
  "Contando uma História",
] as const;

export type ConversationScenario = (typeof CONVERSATION_SCENARIOS)[number];

export const ChatEnSchema = z
  .object({
    lessonId: z.string().cuid().optional(),
    scenario: z.enum(CONVERSATION_SCENARIOS).optional(),
    message: z.string().trim().min(1).max(2000),
  })
  .refine((data) => Boolean(data.lessonId) !== Boolean(data.scenario), {
    message: "Informe lessonId ou scenario, nunca os dois nem nenhum",
    path: ["lessonId"],
  });

export type ChatEnInput = z.infer<typeof ChatEnSchema>;

export const ChatPtSchema = z.object({
  lessonId: z.string().cuid().nullable().optional(),
  message: z.string().trim().min(1).max(2000),
});

export type ChatPtInput = z.infer<typeof ChatPtSchema>;

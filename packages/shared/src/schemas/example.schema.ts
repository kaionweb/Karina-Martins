import { z } from "zod";

export const exampleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
});

export type Example = z.infer<typeof exampleSchema>;

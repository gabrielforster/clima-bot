import { z } from "zod"

export const messageSchema = z.object({
  identifier: z.string().optional(),
  type: z.enum(["text", "answer", "question", "error"]),
  answers: z.array(z.object({
    identifier: z.string().optional(),
    content: z.string(),
  })).optional(),
  answeringId: z.string().optional(),
  answerIdentifier: z.string().optional(),
  content: z.string(),
})

export type SimpleMessage = z.infer<typeof messageSchema>
export type Message = SimpleMessage & {
  id: string
  from: string
  createdAt: Date
}

import { z } from "zod"

export const checkinSimulationSchema = z.object({
  participantId: z.string().min(1, "Selecione um participante."),
  action: z.enum(["entry", "exit"], {
    error: "Selecione a ação do check-in.",
  }),
})

export type CheckinSimulationInput = z.infer<typeof checkinSimulationSchema>


import { z } from 'zod'
import { BUSINESS_RULES } from '@/types'

export const savePredictionSchema = z.object({
  note: z
    .string()
    .max(
      BUSINESS_RULES.MAX_NOTE_LENGTH,
      `Notatka nie może przekraczać ${BUSINESS_RULES.MAX_NOTE_LENGTH} znaków`
    )
    .optional()
    .transform((val) => {
      if (!val) return null
      const trimmed = val.trim()
      return trimmed.length > 0 ? trimmed : null
    }),

  userChoice: z.enum(['home', 'draw', 'away']).nullable(),
})

export type SavePredictionFormData = z.infer<typeof savePredictionSchema>

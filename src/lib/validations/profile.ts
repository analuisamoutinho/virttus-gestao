import { z } from "zod";

const optionalText = z.string().max(2000).optional();

export const updateProfileSchema = z.object({
  teamMemberId: z.string().min(1),
  feedbackPrefs: optionalText,
  motivators: optionalText,
  communicationStyle: optionalText,
  strengths: optionalText,
  watchouts: optionalText,
  aspirations: optionalText,
});

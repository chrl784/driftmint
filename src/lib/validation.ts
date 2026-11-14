import { z } from 'zod';

export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD']);

export const AnalyzeScopeRequestSchema = z.object({
  projectId: z.string().min(1).optional().nullable(),
  projectName: z.string().trim().min(2, 'Project name must be at least 2 characters').max(120),
  hourlyRateCents: z.number().int().min(1000).max(500000),
  currency: CurrencySchema.default('USD'),
  originalSow: z
    .string()
    .trim()
    .min(20, 'Original SOW must be at least 20 characters for accurate comparison')
    .max(12000),
  clientMessage: z
    .string()
    .trim()
    .min(10, 'Client message must be at least 10 characters')
    .max(8000),
});

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  clientName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email('Valid client email is required'),
  hourlyRateCents: z.number().int().min(1000).max(500000),
  currency: CurrencySchema.default('USD'),
  originalSow: z.string().trim().min(20).max(12000),
});

export const DeliverableEstimateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  estimatedHours: z.number().min(0.25).max(500),
  rationale: z.string().trim().min(2).max(400),
});

export const CreateChangeOrderSchema = z.object({
  projectId: z.string().optional().nullable(),
  analysisId: z.string().optional().nullable(),
  agencyName: z.string().trim().min(2).max(120),
  projectName: z.string().trim().min(2).max(120),
  clientName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email('Valid client email is required'),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(2000),
  deliverables: z.array(DeliverableEstimateSchema).min(1).max(20),
  estimatedHours: z.number().min(0.25).max(1000),
  amountCents: z.number().int().min(500).max(50000000),
  currency: CurrencySchema.default('USD'),
});

export const ApproveChangeOrderSchema = z.object({
  signatureName: z.string().trim().min(2, 'Please type your full name to sign').max(120),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Change Order terms to proceed' }),
  }),
  action: z.enum(['approve_and_pay', 'decline']).default('approve_and_pay'),
});

export const CheckoutPlanSchema = z.object({
  plan: z.enum(['starter', 'studio', 'founding_lifetime']),
});

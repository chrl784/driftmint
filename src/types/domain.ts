export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';

export type PlanTier = 'free' | 'starter' | 'studio' | 'founding_lifetime';

export type SubscriptionStatus =
  | 'inactive'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'lifetime';

export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ChangeOrderStatus = 'draft' | 'sent' | 'approved' | 'paid' | 'declined';

export interface DeliverableEstimate {
  title: string;
  estimatedHours: number;
  rationale: string;
}

export interface ReplyDraft {
  tone: 'diplomatic' | 'executive' | 'bundle';
  label: string;
  subject: string;
  body: string;
}

export interface AgencyProfile {
  id: string;
  email: string;
  agencyName: string;
  defaultHourlyRateCents: number;
  currency: Currency;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  monthlyAnalysesUsed: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  clientName: string;
  clientEmail: string;
  hourlyRateCents: number;
  currency: Currency;
  originalSow: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface ScopeAnalysis {
  id: string;
  userId: string;
  projectId: string | null;
  projectName: string;
  clientMessage: string;
  originalSow: string;
  isOutOfScope: boolean;
  driftScore: number;
  severity: DriftSeverity;
  summary: string;
  violatedClauses: string[];
  requestedDeliverables: DeliverableEstimate[];
  totalEstimatedHours: number;
  recommendedAmountCents: number;
  currency: Currency;
  replyDrafts: ReplyDraft[];
  engineSource: 'openai' | 'heuristic';
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  userId: string;
  projectId: string | null;
  analysisId: string | null;
  publicToken: string;
  agencyName: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  title: string;
  summary: string;
  deliverables: DeliverableEstimate[];
  estimatedHours: number;
  amountCents: number;
  currency: Currency;
  status: ChangeOrderStatus;
  clientSignatureName: string | null;
  approvedAt: string | null;
  stripeCheckoutSessionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface DashboardSnapshot {
  mode: 'supabase' | 'sandbox';
  stripeConfigured: boolean;
  openaiConfigured: boolean;
  profile: AgencyProfile;
  projects: Project[];
  analyses: ScopeAnalysis[];
  changeOrders: ChangeOrder[];
  metrics: {
    recoveredRevenueCents: number;
    pendingPipelineCents: number;
    preventedUnbilledHours: number;
    approvalRatePercent: number;
  };
}

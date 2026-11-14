import { promises as fs } from 'fs';
import path from 'path';
import type {
  AgencyProfile,
  ChangeOrder,
  ChangeOrderStatus,
  Currency,
  DashboardSnapshot,
  DeliverableEstimate,
  PlanTier,
  Project,
  ReplyDraft,
  ScopeAnalysis,
  SubscriptionStatus,
} from '@/types/domain';
import {
  isOpenAIConfigured,
  isStripeConfigured,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/env';
import { createPublicToken } from '@/lib/utils';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface SandboxDatabase {
  profile: AgencyProfile;
  projects: Project[];
  analyses: ScopeAnalysis[];
  changeOrders: ChangeOrder[];
  processedStripeEvents: string[];
}

const SANDBOX_FILE_PATH = path.join(process.cwd(), '.driftmint-sandbox.json');
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

function createInitialSandbox(): SandboxDatabase {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * 86400_000).toISOString();
  const oneDayAgo = new Date(now - 86400_000).toISOString();

  const project1Id = 'proj_velox_commerce';
  const project2Id = 'proj_kinetix_saas';

  return {
    profile: {
      id: DEMO_USER_ID,
      email: 'founder@northstar-studio.co',
      agencyName: 'Northstar Digital Studio',
      defaultHourlyRateCents: 16500,
      currency: 'USD',
      planTier: 'studio',
      subscriptionStatus: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      monthlyAnalysesUsed: 2,
    },
    projects: [
      {
        id: project1Id,
        userId: DEMO_USER_ID,
        name: 'Velox Headless Storefront',
        clientName: 'Marcus Vance (Velox Gear)',
        clientEmail: 'marcus@veloxgear.com',
        hourlyRateCents: 16500,
        currency: 'USD',
        originalSow:
          'Phase 1 SOW includes: (1) 5-page marketing & product catalog in Next.js, (2) Standard Shopify Storefront API cart, (3) Mobile responsive styling, (4) Single-language English copy, (5) 2 rounds of design revisions.',
        status: 'active',
        createdAt: threeDaysAgo,
      },
      {
        id: project2Id,
        userId: DEMO_USER_ID,
        name: 'Kinetix B2B Onboarding Portal',
        clientName: 'Elena Rostova (Kinetix AI)',
        clientEmail: 'elena@kinetix.ai',
        hourlyRateCents: 18500,
        currency: 'USD',
        originalSow:
          'Deliverables: Core customer onboarding wizard (3 steps), Supabase Auth email/password login, basic usage table, and deployment to Vercel. Excludes SSO/SAML, custom PDF invoicing, and HubSpot CRM sync.',
        status: 'active',
        createdAt: oneDayAgo,
      },
    ],
    analyses: [],
    changeOrders: [
      {
        id: 'co_seed_paid_1',
        userId: DEMO_USER_ID,
        projectId: project1Id,
        analysisId: null,
        publicToken: 'velox-hubspot-add-on',
        agencyName: 'Northstar Digital Studio',
        projectName: 'Velox Headless Storefront',
        clientName: 'Marcus Vance (Velox Gear)',
        clientEmail: 'marcus@veloxgear.com',
        title: 'Add-On: Abandoned Cart Webhook & Klaviyo Sync',
        summary:
          'Custom webhook listener and Klaviyo profile event sync requested after SOW sign-off.',
        deliverables: [
          {
            title: 'Klaviyo Event Sync & Retry Queue',
            estimatedHours: 6,
            rationale: 'Outside Phase 1 Shopify cart SOW.',
          },
        ],
        estimatedHours: 6,
        amountCents: 99000,
        currency: 'USD',
        status: 'paid',
        clientSignatureName: 'Marcus Vance',
        approvedAt: oneDayAgo,
        stripeCheckoutSessionId: null,
        paidAt: oneDayAgo,
        createdAt: threeDaysAgo,
      },
      {
        id: 'co_seed_sent_2',
        userId: DEMO_USER_ID,
        projectId: project2Id,
        analysisId: null,
        publicToken: 'kinetix-pdf-export',
        agencyName: 'Northstar Digital Studio',
        projectName: 'Kinetix B2B Onboarding Portal',
        clientName: 'Elena Rostova (Kinetix AI)',
        clientEmail: 'elena@kinetix.ai',
        title: 'Add-On: Branded PDF Invoice Generator & RBAC Roles',
        summary:
          'Client requested admin/viewer role separation and downloadable PDF billing statements.',
        deliverables: [
          {
            title: 'RBAC Permission Matrix (Admin vs Viewer)',
            estimatedHours: 5,
            rationale: 'Explicitly excluded in baseline onboarding SOW.',
          },
          {
            title: 'Server-side Branded PDF Statement Export',
            estimatedHours: 4.5,
            rationale: 'Net-new reporting deliverable.',
          },
        ],
        estimatedHours: 9.5,
        amountCents: 175750,
        currency: 'USD',
        status: 'sent',
        clientSignatureName: null,
        approvedAt: null,
        stripeCheckoutSessionId: null,
        paidAt: null,
        createdAt: oneDayAgo,
      },
    ],
    processedStripeEvents: [],
  };
}

let memoryFallback: SandboxDatabase | null = null;

async function readSandbox(): Promise<SandboxDatabase> {
  try {
    const raw = await fs.readFile(SANDBOX_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as SandboxDatabase;
    memoryFallback = parsed;
    return parsed;
  } catch {
    if (!memoryFallback) {
      memoryFallback = createInitialSandbox();
      await writeSandbox(memoryFallback);
    }
    return memoryFallback;
  }
}

async function writeSandbox(db: SandboxDatabase): Promise<void> {
  memoryFallback = db;
  try {
    await fs.writeFile(SANDBOX_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // Non-writable filesystem (e.g., serverless edge); keep in memoryFallback.
  }
}

function computeMetrics(changeOrders: ChangeOrder[]) {
  const paidOrders = changeOrders.filter((c) => c.status === 'paid');
  const pendingOrders = changeOrders.filter((c) => c.status === 'sent' || c.status === 'approved');
  const decidedOrders = changeOrders.filter(
    (c) => c.status === 'approved' || c.status === 'paid' || c.status === 'declined'
  );
  const approvedOrPaid = changeOrders.filter(
    (c) => c.status === 'approved' || c.status === 'paid'
  );

  return {
    recoveredRevenueCents: paidOrders.reduce((acc, c) => acc + c.amountCents, 0),
    pendingPipelineCents: pendingOrders.reduce((acc, c) => acc + c.amountCents, 0),
    preventedUnbilledHours: Number(
      changeOrders
        .filter((c) => c.status !== 'declined')
        .reduce((acc, c) => acc + c.estimatedHours, 0)
        .toFixed(1)
    ),
    approvalRatePercent:
      decidedOrders.length === 0
        ? 100
        : Math.round((approvedOrPaid.length / decidedOrders.length) * 100),
  };
}

async function getAuthenticatedSupabaseUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const userId = await getAuthenticatedSupabaseUserId();

  if (userId && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const [profileRes, projectsRes, analysesRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('scope_analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('change_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    ]);

    const rawProfile = profileRes.data;
    const profile: AgencyProfile = rawProfile
      ? {
          id: rawProfile.id,
          email: rawProfile.email,
          agencyName: rawProfile.agency_name,
          defaultHourlyRateCents: rawProfile.default_hourly_rate_cents,
          currency: rawProfile.currency as Currency,
          planTier: rawProfile.plan_tier as PlanTier,
          subscriptionStatus: rawProfile.subscription_status as SubscriptionStatus,
          stripeCustomerId: rawProfile.stripe_customer_id,
          stripeSubscriptionId: rawProfile.stripe_subscription_id,
          monthlyAnalysesUsed: rawProfile.monthly_analyses_used,
        }
      : {
          id: userId,
          email: '',
          agencyName: 'My Studio',
          defaultHourlyRateCents: 15000,
          currency: 'USD',
          planTier: 'free',
          subscriptionStatus: 'inactive',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          monthlyAnalysesUsed: 0,
        };

    const projects: Project[] = (projectsRes.data ?? []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      clientName: p.client_name,
      clientEmail: p.client_email,
      hourlyRateCents: p.hourly_rate_cents,
      currency: p.currency as Currency,
      originalSow: p.original_sow,
      status: p.status as 'active' | 'archived',
      createdAt: p.created_at,
    }));

    const analyses: ScopeAnalysis[] = (analysesRes.data ?? []).map((a) => ({
      id: a.id,
      userId: a.user_id,
      projectId: a.project_id,
      projectName: a.project_name,
      clientMessage: a.client_message,
      originalSow: a.original_sow,
      isOutOfScope: a.is_out_of_scope,
      driftScore: a.drift_score,
      severity: a.severity,
      summary: a.summary,
      violatedClauses: (a.violated_clauses ?? []) as string[],
      requestedDeliverables: (a.requested_deliverables ?? []) as DeliverableEstimate[],
      totalEstimatedHours: Number(a.total_estimated_hours),
      recommendedAmountCents: a.recommended_amount_cents,
      currency: a.currency as Currency,
      replyDrafts: (a.reply_drafts ?? []) as ReplyDraft[],
      engineSource: a.engine_source === 'openai' ? 'openai' : 'heuristic',
      createdAt: a.created_at,
    }));

    const changeOrders: ChangeOrder[] = (ordersRes.data ?? []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      projectId: c.project_id,
      analysisId: c.analysis_id,
      publicToken: c.public_token,
      agencyName: c.agency_name,
      projectName: c.project_name,
      clientName: c.client_name,
      clientEmail: c.client_email,
      title: c.title,
      summary: c.summary,
      deliverables: (c.deliverables ?? []) as DeliverableEstimate[],
      estimatedHours: Number(c.estimated_hours),
      amountCents: c.amount_cents,
      currency: c.currency as Currency,
      status: c.status as ChangeOrderStatus,
      clientSignatureName: c.client_signature_name,
      approvedAt: c.approved_at,
      stripeCheckoutSessionId: c.stripe_checkout_session_id,
      paidAt: c.paid_at,
      createdAt: c.created_at,
    }));

    return {
      mode: 'supabase',
      stripeConfigured: isStripeConfigured(),
      openaiConfigured: isOpenAIConfigured(),
      profile,
      projects,
      analyses,
      changeOrders,
      metrics: computeMetrics(changeOrders),
    };
  }

  const sandbox = await readSandbox();
  return {
    mode: 'sandbox',
    stripeConfigured: isStripeConfigured(),
    openaiConfigured: isOpenAIConfigured(),
    profile: sandbox.profile,
    projects: sandbox.projects,
    analyses: sandbox.analyses,
    changeOrders: sandbox.changeOrders,
    metrics: computeMetrics(sandbox.changeOrders),
  };
}

export async function saveProject(input: Omit<Project, 'id' | 'userId' | 'status' | 'createdAt'>): Promise<Project> {
  const userId = await getAuthenticatedSupabaseUserId();
  if (userId && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: input.name,
        client_name: input.clientName,
        client_email: input.clientEmail,
        hourly_rate_cents: input.hourlyRateCents,
        currency: input.currency,
        original_sow: input.originalSow,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create project.');
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      clientName: data.client_name,
      clientEmail: data.client_email,
      hourlyRateCents: data.hourly_rate_cents,
      currency: data.currency as Currency,
      originalSow: data.original_sow,
      status: data.status as 'active' | 'archived',
      createdAt: data.created_at,
    };
  }

  const sandbox = await readSandbox();
  const project: Project = {
    id: `proj_${createPublicToken().slice(0, 10)}`,
    userId: sandbox.profile.id,
    name: input.name,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    hourlyRateCents: input.hourlyRateCents,
    currency: input.currency,
    originalSow: input.originalSow,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  sandbox.projects.unshift(project);
  await writeSandbox(sandbox);
  return project;
}

export async function saveScopeAnalysis(
  input: Omit<ScopeAnalysis, 'id' | 'userId' | 'createdAt'>
): Promise<ScopeAnalysis> {
  const userId = await getAuthenticatedSupabaseUserId();
  if (userId && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('scope_analyses')
      .insert({
        user_id: userId,
        project_id: input.projectId,
        project_name: input.projectName,
        client_message: input.clientMessage,
        original_sow: input.originalSow,
        is_out_of_scope: input.isOutOfScope,
        drift_score: input.driftScore,
        severity: input.severity,
        summary: input.summary,
        violated_clauses: input.violatedClauses,
        requested_deliverables: input.requestedDeliverables,
        total_estimated_hours: input.totalEstimatedHours,
        recommended_amount_cents: input.recommendedAmountCents,
        currency: input.currency,
        reply_drafts: input.replyDrafts,
        engine_source: input.engineSource,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to persist scope analysis.');
    }

    return {
      ...input,
      id: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
    };
  }

  const sandbox = await readSandbox();
  const record: ScopeAnalysis = {
    ...input,
    id: `ana_${createPublicToken().slice(0, 10)}`,
    userId: sandbox.profile.id,
    createdAt: new Date().toISOString(),
  };
  sandbox.analyses.unshift(record);
  sandbox.profile.monthlyAnalysesUsed += 1;
  await writeSandbox(sandbox);
  return record;
}

export async function createChangeOrder(
  input: Omit<
    ChangeOrder,
    | 'id'
    | 'userId'
    | 'publicToken'
    | 'status'
    | 'clientSignatureName'
    | 'approvedAt'
    | 'stripeCheckoutSessionId'
    | 'paidAt'
    | 'createdAt'
  >
): Promise<ChangeOrder> {
  const userId = await getAuthenticatedSupabaseUserId();
  const publicToken = createPublicToken();

  if (userId && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('change_orders')
      .insert({
        user_id: userId,
        project_id: input.projectId,
        analysis_id: input.analysisId,
        public_token: publicToken,
        agency_name: input.agencyName,
        project_name: input.projectName,
        client_name: input.clientName,
        client_email: input.clientEmail,
        title: input.title,
        summary: input.summary,
        deliverables: input.deliverables,
        estimated_hours: input.estimatedHours,
        amount_cents: input.amountCents,
        currency: input.currency,
        status: 'sent',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create Change Order.');
    }

    return {
      ...input,
      id: data.id,
      userId: data.user_id,
      publicToken: data.public_token,
      status: data.status as ChangeOrderStatus,
      clientSignatureName: null,
      approvedAt: null,
      stripeCheckoutSessionId: null,
      paidAt: null,
      createdAt: data.created_at,
    };
  }

  const sandbox = await readSandbox();
  const order: ChangeOrder = {
    ...input,
    id: `co_${createPublicToken().slice(0, 10)}`,
    userId: sandbox.profile.id,
    publicToken,
    status: 'sent',
    clientSignatureName: null,
    approvedAt: null,
    stripeCheckoutSessionId: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };
  sandbox.changeOrders.unshift(order);
  await writeSandbox(sandbox);
  return order;
}

export async function getChangeOrderByToken(token: string): Promise<ChangeOrder | null> {
  if (isSupabaseAdminConfigured()) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('change_orders')
      .select('*')
      .eq('public_token', token)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      analysisId: data.analysis_id,
      publicToken: data.public_token,
      agencyName: data.agency_name,
      projectName: data.project_name,
      clientName: data.client_name,
      clientEmail: data.client_email,
      title: data.title,
      summary: data.summary,
      deliverables: (data.deliverables ?? []) as DeliverableEstimate[],
      estimatedHours: Number(data.estimated_hours),
      amountCents: data.amount_cents,
      currency: data.currency as Currency,
      status: data.status as ChangeOrderStatus,
      clientSignatureName: data.client_signature_name,
      approvedAt: data.approved_at,
      stripeCheckoutSessionId: data.stripe_checkout_session_id,
      paidAt: data.paid_at,
      createdAt: data.created_at,
    };
  }

  const sandbox = await readSandbox();
  return sandbox.changeOrders.find((c) => c.publicToken === token) ?? null;
}

export async function updateChangeOrderByToken(
  token: string,
  patch: Partial<{
    status: ChangeOrderStatus;
    clientSignatureName: string;
    clientSignatureIp: string;
    approvedAt: string;
    stripeCheckoutSessionId: string;
    stripePaymentIntentId: string;
    paidAt: string;
  }>
): Promise<ChangeOrder | null> {
  if (isSupabaseAdminConfigured()) {
    const admin = createSupabaseAdminClient();
    const dbPatch: Record<string, string> = {};
    if (patch.status) dbPatch.status = patch.status;
    if (patch.clientSignatureName) dbPatch.client_signature_name = patch.clientSignatureName;
    if (patch.clientSignatureIp) dbPatch.client_signature_ip = patch.clientSignatureIp;
    if (patch.approvedAt) dbPatch.approved_at = patch.approvedAt;
    if (patch.stripeCheckoutSessionId) dbPatch.stripe_checkout_session_id = patch.stripeCheckoutSessionId;
    if (patch.stripePaymentIntentId) dbPatch.stripe_payment_intent_id = patch.stripePaymentIntentId;
    if (patch.paidAt) dbPatch.paid_at = patch.paidAt;

    const { data, error } = await admin
      .from('change_orders')
      .update(dbPatch)
      .eq('public_token', token)
      .select('*')
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      analysisId: data.analysis_id,
      publicToken: data.public_token,
      agencyName: data.agency_name,
      projectName: data.project_name,
      clientName: data.client_name,
      clientEmail: data.client_email,
      title: data.title,
      summary: data.summary,
      deliverables: (data.deliverables ?? []) as DeliverableEstimate[],
      estimatedHours: Number(data.estimated_hours),
      amountCents: data.amount_cents,
      currency: data.currency as Currency,
      status: data.status as ChangeOrderStatus,
      clientSignatureName: data.client_signature_name,
      approvedAt: data.approved_at,
      stripeCheckoutSessionId: data.stripe_checkout_session_id,
      paidAt: data.paid_at,
      createdAt: data.created_at,
    };
  }

  const sandbox = await readSandbox();
  const idx = sandbox.changeOrders.findIndex((c) => c.publicToken === token);
  if (idx === -1) return null;

  const existing = sandbox.changeOrders[idx];
  const updated: ChangeOrder = {
    ...existing,
    status: patch.status ?? existing.status,
    clientSignatureName: patch.clientSignatureName ?? existing.clientSignatureName,
    approvedAt: patch.approvedAt ?? existing.approvedAt,
    stripeCheckoutSessionId: patch.stripeCheckoutSessionId ?? existing.stripeCheckoutSessionId,
    paidAt: patch.paidAt ?? existing.paidAt,
  };
  sandbox.changeOrders[idx] = updated;
  await writeSandbox(sandbox);
  return updated;
}

export async function recordStripeEventIfNew(eventId: string, eventType: string): Promise<boolean> {
  if (isSupabaseAdminConfigured()) {
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from('stripe_events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle();

    if (existing) return false;

    const { error } = await admin
      .from('stripe_events')
      .insert({ id: eventId, event_type: eventType });
    return !error;
  }

  const sandbox = await readSandbox();
  if (sandbox.processedStripeEvents.includes(eventId)) {
    return false;
  }
  sandbox.processedStripeEvents.push(eventId);
  await writeSandbox(sandbox);
  return true;
}

export async function updateAgencySubscription(params: {
  userId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  planTier?: PlanTier;
  subscriptionStatus: SubscriptionStatus;
}): Promise<void> {
  if (isSupabaseAdminConfigured()) {
    const admin = createSupabaseAdminClient();
    const updatePayload: Record<string, string | null> = {
      subscription_status: params.subscriptionStatus,
    };
    if (params.planTier) updatePayload.plan_tier = params.planTier;
    if (params.stripeCustomerId) updatePayload.stripe_customer_id = params.stripeCustomerId;
    if (params.stripeSubscriptionId !== undefined) {
      updatePayload.stripe_subscription_id = params.stripeSubscriptionId;
    }

    if (params.userId) {
      await admin.from('profiles').update(updatePayload).eq('id', params.userId);
    } else if (params.stripeCustomerId) {
      await admin
        .from('profiles')
        .update(updatePayload)
        .eq('stripe_customer_id', params.stripeCustomerId);
    }
    return;
  }

  const sandbox = await readSandbox();
  if (params.planTier) sandbox.profile.planTier = params.planTier;
  sandbox.profile.subscriptionStatus = params.subscriptionStatus;
  if (params.stripeCustomerId) sandbox.profile.stripeCustomerId = params.stripeCustomerId;
  if (params.stripeSubscriptionId !== undefined) {
    sandbox.profile.stripeSubscriptionId = params.stripeSubscriptionId;
  }
  await writeSandbox(sandbox);
}

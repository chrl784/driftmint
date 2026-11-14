import OpenAI from 'openai';
import { z } from 'zod';
import { isOpenAIConfigured } from '@/lib/env';
import { formatMoney } from '@/lib/utils';
import type {
  Currency,
  DeliverableEstimate,
  DriftSeverity,
  ReplyDraft,
} from '@/types/domain';

const AIOutputSchema = z.object({
  isOutOfScope: z.boolean(),
  driftScore: z.number().min(0).max(100),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  summary: z.string().min(10),
  violatedClauses: z.array(z.string()).max(6),
  requestedDeliverables: z
    .array(
      z.object({
        title: z.string().min(2),
        estimatedHours: z.number().min(0.5).max(300),
        rationale: z.string().min(4),
      })
    )
    .min(1)
    .max(8),
  replyDrafts: z
    .array(
      z.object({
        tone: z.enum(['diplomatic', 'executive', 'bundle']),
        label: z.string(),
        subject: z.string(),
        body: z.string(),
      })
    )
    .min(3)
    .max(3),
});

export interface AnalyzeScopeInput {
  projectName: string;
  originalSow: string;
  clientMessage: string;
  hourlyRateCents: number;
  currency: Currency;
}

export interface AnalyzeScopeResult {
  isOutOfScope: boolean;
  driftScore: number;
  severity: DriftSeverity;
  summary: string;
  violatedClauses: string[];
  requestedDeliverables: DeliverableEstimate[];
  totalEstimatedHours: number;
  recommendedAmountCents: number;
  replyDrafts: ReplyDraft[];
  engineSource: 'openai' | 'heuristic';
}

const SCOPE_SIGNALS: Array<{
  pattern: RegExp;
  label: string;
  hours: number;
  rationale: string;
}> = [
  {
    pattern: /\b(dark mode|theme|rebrand|redesign|new layout|figma|mockup)\b/i,
    label: 'Additional UI/UX Design & Theme Architecture',
    hours: 6,
    rationale: 'Requires bespoke visual token adjustments, QA across viewports, and layout refactoring beyond the signed SOW.',
  },
  {
    pattern: /\b(stripe|payment|billing|checkout|subscription|invoice|webhook)\b/i,
    label: 'Payment & Billing Flow Integration',
    hours: 8,
    rationale: 'Involves payment gateway configuration, webhook verification, and end-to-end edge-case testing.',
  },
  {
    pattern: /\b(crm|hubspot|salesforce|zapier|slack|api|sync|integration|export|csv|pdf)\b/i,
    label: 'Third-Party API / Data Export Integration',
    hours: 5.5,
    rationale: 'Adds external API mapping, error retries, and payload validation not included in core deliverables.',
  },
  {
    pattern: /\b(admin|dashboard|role|permission|rbac|auth|sso|login|portal)\b/i,
    label: 'Access Control & Admin Workflow Expansion',
    hours: 7,
    rationale: 'Introduces authorization rules, UI views, and security regression testing outside the baseline scope.',
  },
  {
    pattern: /\b(mobile|ios|android|responsive|safari|tablet)\b/i,
    label: 'Extended Cross-Device / Mobile Optimization',
    hours: 4,
    rationale: 'Requires dedicated breakpoint engineering and touch-target QA outside original screen specifications.',
  },
  {
    pattern: /\b(seo|analytics|tracking|pixel|ga4|meta|multilingual|translation|i18n|french|spanish)\b/i,
    label: 'Localization / Analytics & Tracking Setup',
    hours: 4.5,
    rationale: 'Covers event schema instrumentation or multi-locale routing not itemized in the original agreement.',
  },
  {
    pattern: /\b(urgent|asap|tomorrow|friday|weekend|rush|expedite)\b/i,
    label: 'Expedited Turnaround & Priority Sprint Allocation',
    hours: 3,
    rationale: 'Requires schedule reprioritization and compressed QA cycles to hit an accelerated deadline.',
  },
];

function buildHeuristicAnalysis(input: AnalyzeScopeInput): AnalyzeScopeResult {
  const sowLower = input.originalSow.toLowerCase();
  const matchedDeliverables: DeliverableEstimate[] = [];

  for (const signal of SCOPE_SIGNALS) {
    if (signal.pattern.test(input.clientMessage)) {
      const firstKeyword = signal.pattern.source.match(/[a-z]+/i)?.[0] ?? '';
      const alreadyExplicitlyInSow =
        firstKeyword.length > 3 &&
        sowLower.includes(`including ${firstKeyword}`) &&
        !input.clientMessage.toLowerCase().includes('also') &&
        !input.clientMessage.toLowerCase().includes('extra');

      if (!alreadyExplicitlyInSow) {
        matchedDeliverables.push({
          title: signal.label,
          estimatedHours: signal.hours,
          rationale: signal.rationale,
        });
      }
    }
  }

  const expansionPhrases =
    /\b(also|while you're at it|quick favor|one more thing|can we add|could you add|extra|new page|new feature|out of scope|additionally)\b/i.test(
      input.clientMessage
    );

  if (matchedDeliverables.length === 0) {
    matchedDeliverables.push({
      title: expansionPhrases
        ? 'Unscoped Feature Addition & Implementation QA'
        : 'Incremental Scope Clarification & Engineering Support',
      estimatedHours: expansionPhrases ? 4 : 2,
      rationale: expansionPhrases
        ? 'Client message introduces net-new functionality outside the approved baseline deliverables.'
        : 'Minor refinement request requiring scoped implementation and verification.',
    });
  }

  const totalEstimatedHours = Number(
    matchedDeliverables.reduce((sum, item) => sum + item.estimatedHours, 0).toFixed(1)
  );
  const recommendedAmountCents = Math.round(totalEstimatedHours * input.hourlyRateCents);

  const rawScore = Math.min(
    98,
    Math.max(
      24,
      (expansionPhrases ? 35 : 15) + matchedDeliverables.length * 22
    )
  );
  const isOutOfScope = rawScore >= 45;
  const severity: DriftSeverity =
    rawScore >= 85
      ? 'critical'
      : rawScore >= 68
        ? 'high'
        : rawScore >= 45
          ? 'medium'
          : 'low';

  const formattedTotal = formatMoney(recommendedAmountCents, input.currency);
  const topDeliverableNames = matchedDeliverables.map((d) => d.title).join(', ');

  const violatedClauses: string[] = [
    `Original SOW baseline for "${input.projectName}" defines fixed deliverables and excludes net-new feature additions.`,
  ];
  if (matchedDeliverables.length > 1) {
    violatedClauses.push(
      `Client request bundles ${matchedDeliverables.length} separate workstreams (${topDeliverableNames}).`
    );
  }
  if (/urgent|asap|tomorrow|friday|rush/i.test(input.clientMessage)) {
    violatedClauses.push('Accelerated timeline falls outside the standard sprint cadence in the SOW.');
  }

  const summary = isOutOfScope
    ? `Clear scope drift detected (${rawScore}/100). The client is requesting ${matchedDeliverables.length} out-of-scope addition(s) totaling an estimated ${totalEstimatedHours} hours (${formattedTotal}).`
    : `Low-risk request (${rawScore}/100). Mostly aligned with the SOW, though formalizing the ${totalEstimatedHours}h buffer protects delivery timelines.`;

  const replyDrafts: ReplyDraft[] = [
    {
      tone: 'diplomatic',
      label: 'Soft Boundary + Instant Approval Link',
      subject: `Quick scope add-on for ${input.projectName}`,
      body: `Hi there,\n\nLove this idea — ${matchedDeliverables[0].title.toLowerCase()} will definitely make ${input.projectName} stronger.\n\nSince this sits outside our original SOW deliverables, I packaged it into a streamlined ${totalEstimatedHours}-hour Change Order (${formattedTotal}) so we can keep our core launch date untouched.\n\nYou can review and approve it in one click here: [CHANGE_ORDER_LINK]\n\nAs soon as it's signed off, I'll slot it straight into this week's sprint!`,
    },
    {
      tone: 'executive',
      label: 'Direct & Professional',
      subject: `Change Order: ${input.projectName} Scope Addition (${formattedTotal})`,
      body: `Hello,\n\nThanks for sending over the new requirements for ${input.projectName}. Based on our signed SOW, the items below require an addendum:\n\n${matchedDeliverables.map((d) => `• ${d.title} (${d.estimatedHours}h)`).join('\n')}\n\nTotal estimate: ${totalEstimatedHours} hours — ${formattedTotal}.\n\nPlease approve and settle the Change Order here so our team can begin immediately: [CHANGE_ORDER_LINK]`,
    },
    {
      tone: 'bundle',
      label: 'Value-Bundle Anchor',
      subject: `Options for your new ${input.projectName} request`,
      body: `Hi!\n\nHappy to take care of this for you. Because this expands beyond our agreed Phase 1 SOW, here are two quick paths:\n\n1) Fast-Track Add-On: We implement ${matchedDeliverables.map((d) => d.title).join(' + ')} immediately for ${formattedTotal} (${totalEstimatedHours}h).\n2) Phase 2 Backlog: We lock Phase 1 as-is and queue these items for next month's sprint.\n\nIf you'd like us to fast-track it now, approve here in 30 seconds: [CHANGE_ORDER_LINK]`,
    },
  ];

  return {
    isOutOfScope,
    driftScore: Math.round(rawScore),
    severity,
    summary,
    violatedClauses,
    requestedDeliverables: matchedDeliverables,
    totalEstimatedHours,
    recommendedAmountCents,
    replyDrafts,
    engineSource: 'heuristic',
  };
}

export async function analyzeScopeDrift(input: AnalyzeScopeInput): Promise<AnalyzeScopeResult> {
  if (!isOpenAIConfigured()) {
    return buildHeuristicAnalysis(input);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const hourlyRateFormatted = formatMoney(input.hourlyRateCents, input.currency);

  const systemPrompt = `You are DriftMint, an elite B2B agency operations & contract scope auditor.
Compare the client's incoming message against the Original Statement of Work (SOW).
Identify every out-of-scope deliverable, estimate realistic engineering/design hours, and draft 3 diplomatic yet firm replies containing the literal placeholder [CHANGE_ORDER_LINK] so the agency can attach its Stripe payment link.
Return STRICT JSON matching the requested schema.`;

  const userPrompt = `Project: ${input.projectName}
Agency Hourly Rate: ${hourlyRateFormatted} (${input.currency})

ORIGINAL SOW:
"""
${input.originalSow}
"""

CLIENT MESSAGE:
"""
${input.clientMessage}
"""

Return JSON with:
{
  "isOutOfScope": boolean,
  "driftScore": number (0-100),
  "severity": "low" | "medium" | "high" | "critical",
  "summary": string (2 concise sentences max),
  "violatedClauses": string[] (1-4 concrete mismatches vs SOW),
  "requestedDeliverables": [{ "title": string, "estimatedHours": number, "rationale": string }],
  "replyDrafts": [
    { "tone": "diplomatic", "label": "Soft Boundary + Instant Approval Link", "subject": string, "body": string },
    { "tone": "executive", "label": "Direct & Professional", "subject": string, "body": string },
    { "tone": "bundle", "label": "Value-Bundle Anchor", "subject": string, "body": string }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return buildHeuristicAnalysis(input);
    }

    const parsedJson = JSON.parse(rawContent) as unknown;
    const validated = AIOutputSchema.safeParse(parsedJson);

    if (!validated.success) {
      return buildHeuristicAnalysis(input);
    }

    const data = validated.data;
    const totalEstimatedHours = Number(
      data.requestedDeliverables.reduce((sum, item) => sum + item.estimatedHours, 0).toFixed(1)
    );
    const recommendedAmountCents = Math.round(totalEstimatedHours * input.hourlyRateCents);

    return {
      isOutOfScope: data.isOutOfScope,
      driftScore: Math.round(data.driftScore),
      severity: data.severity,
      summary: data.summary,
      violatedClauses: data.violatedClauses,
      requestedDeliverables: data.requestedDeliverables,
      totalEstimatedHours,
      recommendedAmountCents,
      replyDrafts: data.replyDrafts,
      engineSource: 'openai',
    };
  } catch {
    return buildHeuristicAnalysis(input);
  }
}

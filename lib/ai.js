/**
 * VSL Partner — AI feature layer (Phase 3).
 *
 * Thin wrapper around @anthropic-ai/sdk. All four features live here;
 * server.js routes call these functions and handle HTTP concerns (auth,
 * validation, persistence). This module is pure async — no filesystem,
 * no DB, no Express.
 *
 * Model assignments:
 *   Haiku  — generatePitchDraft, summarizeEngagement  (fast + cheap; structured/simple output)
 *   Sonnet — detectContentGaps, generateVariants       (cross-section reasoning + creativity)
 *
 * Error contract: every function throws a typed Error with a .code property:
 *   'no_key'   — ANTHROPIC_API_KEY env var missing
 *   'quota'    — 429 from API
 *   'upstream' — 5xx from API or network failure
 *   'parse'    — model returned malformed JSON (raw text attached as .raw)
 *   'timeout'  — request exceeded 60s
 */

'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const HAIKU  = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw typed('ANTHROPIC_API_KEY env var is required for AI features', 'no_key');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 });
  }
  return _client;
}

function typed(msg, code, extra = {}) {
  return Object.assign(new Error(msg), { code, ...extra });
}

function wrapApiError(e) {
  if (e.code) return e;
  if (e instanceof Anthropic.APIError) {
    if (e.status === 429) return typed('AI quota exceeded', 'quota');
    if (e.status >= 500)  return typed('AI upstream error', 'upstream');
  }
  if (e.name === 'AbortError' || e.message?.includes('timeout')) return typed('AI request timed out', 'timeout');
  return typed(e.message || 'AI call failed', 'upstream');
}

function parseJson(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  try { return JSON.parse(raw); }
  catch { throw typed('AI returned malformed JSON', 'parse', { raw }); }
}

function usage(msg) {
  return { inputTokens: msg.usage?.input_tokens ?? 0, outputTokens: msg.usage?.output_tokens ?? 0 };
}

/* ------------------------------------------------------------------ */
/* VSL brand voice context — injected into every prompt so the model
   stays on-brand without repeating it in each caller.               */
/* ------------------------------------------------------------------ */
const VSL_VOICE = `
Visit Salt Lake (VSL) is the destination marketing organization for Salt Lake City, Utah.

Brand voice: confident, editorial, warm but strategic. Never generic. Specific over vague.
Use short declarative sentences. Avoid superlatives ("world-class", "incredible").
Lead with the story, support with data.

Salt Lake's key narratives:
- "America's Mountain City" — unique because mountains rise directly from the edge of downtown
- Major upcoming moments: America 250 (2026), NHL Winter Classic (2027), Temple open house (2027), 2034 Winter Olympics
- Culinary scene on the rise: James Beard semifinalists, Michelin Guide coming to Utah
- Proximity: urban sophistication + outdoor adventure in one city
- Rapid growth with authentic character still intact

Partnership philosophy: VSL isn't an outside agency — we ARE the destination.
We offer partners direct access to Salt Lake-focused travelers through owned,
earned, and paid channels (154K email subscribers, 446K social followers, 3.8M+ organic impressions).
`.trim();

/* ------------------------------------------------------------------ */
/* Feature 1: Pitch draft generation                                  */
/* Model: Haiku — structured template fill, speed matters             */
/* ------------------------------------------------------------------ */

/**
 * Generate a first-cut pitch draft for a new partner.
 *
 * @param {object} opts
 * @param {string}   opts.partnerName   e.g. "Canyon Spirit"
 * @param {string}   opts.industry      e.g. "luxury rail travel"
 * @param {string[]} [opts.sectionIds]  ordered section IDs from edit-manifest (for context)
 * @returns {Promise<{ draft: object, usage: object, model: string }>}
 */
async function generatePitchDraft({ partnerName, industry, sectionIds = [] }) {
  if (!partnerName || !industry) throw typed('partnerName and industry are required', 'validation');

  const sectionHint = sectionIds.length
    ? `\nThe pitch has these sections in order: ${sectionIds.join(', ')}.`
    : '';

  const prompt = `${VSL_VOICE}

Generate a partnership proposal draft for ${partnerName}, a company in the ${industry} industry.${sectionHint}

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.
Only include text fields. Do NOT invent image paths, logo URLs, hex colors, or pricing.
Use \\n for line breaks within multi-line strings.

Required JSON shape (include ALL these keys, leave unknown strings as empty ""):
{
  "meta": {
    "browserTitle": "${partnerName} × Visit Salt Lake — Partnership Proposal",
    "pageDescription": "...(1-2 sentence description)...",
    "partnershipLabel": "${partnerName} × VSL"
  },
  "hero": {
    "eyebrow": "Partnership Proposal · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}",
    "preparedBy": "Prepared by Visit Salt Lake",
    "title": "...(short evocative title, 2-5 words, can use \\n)...",
    "scrollHint": "Scroll to begin"
  },
  "intro": {
    "eyebrow": "",
    "headline": "...(compelling headline about the partnership opportunity, can use \\n)...",
    "body": "...(2-3 sentences: why this moment, why this partnership)..."
  },
  "opportunityBreak": { "chapter": "01", "label": "Chapter One", "title": "The opportunity" },
  "whySaltLake": {
    "eyebrow": "Why Activate Here",
    "headline": "Why Salt Lake",
    "body": "...(2 paragraphs about why Salt Lake is relevant to ${partnerName}'s audience, separated by \\n\\n)...",
    "pillars": [
      { "title": "...", "note": "..." },
      { "title": "...", "note": "..." },
      { "title": "...", "note": "..." },
      { "title": "...", "note": "..." }
    ]
  },
  "whatWeDoBreak": { "chapter": "02", "label": "Chapter Two", "title": "What we do" },
  "capabilities": {
    "eyebrow": "How We Show Up for Partners",
    "headline": "We not only support the community — we strategically amplify and market partner brands.",
    "items": [
      { "n": "01", "title": "Targeting & optimization", "body": "Data-informed geographic and custom audience targeting." },
      { "n": "02", "title": "Experiential activation", "body": "Community activations and event integrations that connect your brand directly with travelers." },
      { "n": "03", "title": "Advanced measurement", "body": "Tools that track the customer journey from initial exposure through on-the-ground engagement." },
      { "n": "04", "title": "Organic channel integration", "body": "Website, blog, social, influencers, and visitor touchpoints working as a unified ecosystem." },
      { "n": "05", "title": "Custom content & distribution", "body": "Customized content tailored for our channels and for your brand." }
    ]
  },
  "whyPartner": {
    "eyebrow": "",
    "headline": "Why partner with Visit Salt Lake",
    "body": "...(1-2 sentences: VSL's unique positioning as the destination itself)...",
    "bullets": [
      { "text": "..." },
      { "text": "..." },
      { "text": "..." },
      { "text": "..." },
      { "text": "..." }
    ]
  },
  "partnershipBreak": { "chapter": "03", "label": "Chapter Three", "title": "Partnership opportunities" },
  "successLooksLike": {
    "eyebrow": "What Success Looks Like",
    "headline": "...(1-2 sentences about what a successful partnership achieves)...",
    "body": ""
  },
  "tiers": {
    "eyebrow": "Partnership Opportunities",
    "headline": "Built to scale with your goals.",
    "intro": ""
  },
  "close": {
    "eyebrow": "Let's build something together.",
    "body": "...(1-2 sentences inviting ${partnerName} to take the next step)...",
    "ctaLabel": "Get in touch",
    "ctaHref": "mailto:partnerships@visitsaltlake.com",
    "contactName": "Visit Salt Lake Partnerships",
    "contactTitle": "Partnership Development",
    "footnote": ""
  }
}`;

  try {
    const msg = await client().messages.create({
      model: HAIKU,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const draft = parseJson(msg.content[0].text);
    return { draft, usage: usage(msg), model: HAIKU };
  } catch (e) {
    throw wrapApiError(e);
  }
}

/* ------------------------------------------------------------------ */
/* Feature 2: Viewer engagement summary                               */
/* Model: Haiku — simple narration, small context, very cheap         */
/* ------------------------------------------------------------------ */

/**
 * Natural-language summary of viewer analytics for a deck.
 *
 * @param {object}   opts
 * @param {string}   opts.slug
 * @param {object[]} opts.viewers     rows from analytics.viewers()
 * @param {object}   [opts.summary]   row from analytics.deckSummary()
 * @param {{ from: string, to: string }} [opts.range]
 * @returns {Promise<{ narrative: string, usage: object, model: string }>}
 */
async function summarizeEngagement({ slug, viewers = [], summary = null, range = null }) {
  if (!viewers.length) {
    return { narrative: 'No engagement data available for this pitch in the selected date range.', usage: { inputTokens: 0, outputTokens: 0 }, model: HAIKU };
  }

  const rangeStr = range ? `${range.from.slice(0,10)} to ${range.to.slice(0,10)}` : 'all time';

  const viewerLines = viewers.slice(0, 20).map(v => {
    const sections = Object.entries(v.sectionActiveSeconds || {})
      .sort((a, b) => b[1] - a[1])
      .map(([id, secs]) => `${id}:${secs}s`)
      .join(', ');
    const totalMins = Math.round((v.activeSecondsInRange || v.totalSecondsLifetime || 0) / 60);
    return `  - ${v.email || 'anonymous'}: ${v.sessionsInRange ?? v.totalOpensLifetime ?? 1} session(s), ~${totalMins}min${sections ? `, sections: ${sections}` : ''}`;
  }).join('\n');

  const summaryLine = summary
    ? `Deck totals: ${summary.uniqueViewers ?? '?'} unique viewers, ${summary.totalSessions ?? '?'} sessions, avg ${Math.round((summary.avgSeconds ?? 0) / 60)}min`
    : '';

  const prompt = `You are an analyst summarizing partner engagement data for Visit Salt Lake.

Pitch: ${slug}
Date range: ${rangeStr}
${summaryLine}

Viewer breakdown:
${viewerLines}

Write a 2-3 sentence plain-English summary for the VSL partnerships team. Cover:
1. Overall engagement level (strong / moderate / light)
2. Which sections got the most attention
3. Any standout viewers or patterns worth following up on

Be specific. Use the actual numbers. Avoid filler phrases like "it's worth noting".`;

  try {
    const msg = await client().messages.create({
      model: HAIKU,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    return { narrative: msg.content[0].text.trim(), usage: usage(msg), model: HAIKU };
  } catch (e) {
    throw wrapApiError(e);
  }
}

/* ------------------------------------------------------------------ */
/* Feature 3: Content gap detection                                   */
/* Model: Sonnet — cross-section reasoning + editorial judgment       */
/* ------------------------------------------------------------------ */

/**
 * Detect thin copy, missing sections, repetitive language, generic claims.
 *
 * @param {object}   opts
 * @param {string}   opts.slug
 * @param {object}   opts.content     merged content object (baseline + overrides applied)
 * @param {string[]} [opts.sectionIds]
 * @returns {Promise<{ findings: Finding[], usage: object, model: string }>}
 *
 * Finding: { sectionId, severity: 'high'|'medium'|'low', kind: 'thin'|'missing'|'repetitive'|'generic', message }
 */
async function detectContentGaps({ slug, content, sectionIds = [] }) {
  if (!content || typeof content !== 'object') throw typed('content object is required', 'validation');

  const contentSnapshot = JSON.stringify(content, null, 2).slice(0, 8000);

  const prompt = `${VSL_VOICE}

You are reviewing a partnership pitch for ${slug}. Identify content quality issues.

Current pitch content (JSON):
${contentSnapshot}

${sectionIds.length ? `Defined sections: ${sectionIds.join(', ')}` : ''}

Find issues across these four categories:
- "thin": Body text under ~40 words where more detail would help
- "missing": A section exists in the schema but has empty or placeholder text
- "repetitive": The same word or phrase used 3+ times across sections
- "generic": Vague claims with no specifics (e.g., "world-class", "unique opportunity" without supporting detail)

Return ONLY a JSON array — no markdown, no explanation:
[
  {
    "sectionId": "the section key (e.g. intro, tiers, close)",
    "severity": "high|medium|low",
    "kind": "thin|missing|repetitive|generic",
    "message": "One clear sentence explaining the issue and how to fix it."
  }
]

Return an empty array [] if no issues are found. Limit to the 8 most important findings.`;

  try {
    const msg = await client().messages.create({
      model: SONNET,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const findings = parseJson(msg.content[0].text);
    if (!Array.isArray(findings)) throw typed('AI returned non-array findings', 'parse', { raw: msg.content[0].text });
    return { findings, usage: usage(msg), model: SONNET };
  } catch (e) {
    throw wrapApiError(e);
  }
}

/* ------------------------------------------------------------------ */
/* Feature 4: Personalized pitch variants                             */
/* Model: Sonnet — creative + strategic, audience-aware messaging     */
/* ------------------------------------------------------------------ */

/**
 * Generate per-segment content variants as override objects.
 *
 * @param {object}   opts
 * @param {string}   opts.slug
 * @param {object}   opts.content    merged content object
 * @param {string[]} opts.segments   audience segment labels, 1-4 items
 * @returns {Promise<{ variants: Variant[], usage: object, model: string }>}
 *
 * Variant: { segment, label, overrides: object }  — overrides can be written directly to draft
 */
async function generateVariants({ slug, content, segments }) {
  if (!Array.isArray(segments) || !segments.length) throw typed('segments must be a non-empty array', 'validation');
  if (segments.length > 4) throw typed('max 4 segments per request', 'validation');
  if (!content || typeof content !== 'object') throw typed('content object is required', 'validation');

  const baseJson = JSON.stringify({
    hero: content.hero,
    intro: content.intro,
    successLooksLike: content.successLooksLike,
    close: content.close,
  }, null, 2);

  const prompt = `${VSL_VOICE}

You are personalizing a Visit Salt Lake partnership pitch (${slug}) for different audience segments.

Base content (key sections only):
${baseJson}

Generate a personalized variant for each of these audience segments: ${segments.map(s => `"${s}"`).join(', ')}.

For each segment, return a partial override object that adapts the messaging tone and emphasis.
Only override the text fields that meaningfully differ per audience. Keep unchanged fields absent.

Return ONLY a JSON array — no markdown, no explanation:
[
  {
    "segment": "exact segment label from the input",
    "label": "short display name for this variant",
    "overrides": {
      "hero": { "title": "...(variant title if different)..." },
      "intro": { "headline": "...", "body": "..." },
      "successLooksLike": { "headline": "...", "body": "..." },
      "close": { "eyebrow": "...", "body": "..." }
    }
  }
]

Segment guidance:
- C-suite / executive: Lead with ROI, strategic alignment, measurable outcomes
- Marketing / brand: Lead with creative collaboration, audience reach, co-branded opportunities
- Operations / logistics: Lead with practical execution, timelines, deliverables
- Consumer / leisure: Lead with experience, story, adventure`;

  try {
    const msg = await client().messages.create({
      model: SONNET,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const variants = parseJson(msg.content[0].text);
    if (!Array.isArray(variants)) throw typed('AI returned non-array variants', 'parse', { raw: msg.content[0].text });
    return { variants, usage: usage(msg), model: SONNET };
  } catch (e) {
    throw wrapApiError(e);
  }
}

module.exports = { generatePitchDraft, summarizeEngagement, detectContentGaps, generateVariants };

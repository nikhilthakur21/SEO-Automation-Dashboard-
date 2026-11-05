const SYSTEM_PROMPT = `You are a senior SEO analyst with 15+ years experience specialising in
Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only — no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low),
effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

const USER_PROMPT_TEMPLATE = `Analyse the following SEO signals for: {URL}
Business type: {BUSINESS_TYPE}
Business location: {CITY}, {STATE}, India

=== ON-PAGE DATA ===
{ON_PAGE_JSON}

=== TECHNICAL DATA ===
{TECHNICAL_JSON}

=== CORE WEB VITALS ===
{CWV_JSON}

=== SCHEMA.ORG DATA ===
{SCHEMA_JSON}

=== GOOGLE SEARCH CONSOLE ===
{GSC_JSON}

=== KEYWORD RANKINGS ===
{RANKINGS_JSON}

Respond ONLY with this JSON structure — no other text:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100>,
  "score_breakdown": { "technical": <0-100>, "on_page": <0-100>,
                       "content": <0-100>, "core_web_vitals": <0-100>,
                       "schema": <0-100> },
  "critical_issues": [<max 5 items>],
  "important_issues": [<max 8 items>],
  "quick_wins": [<max 5 items — effort <= 2 hours>],
  "recommendations": [{
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "category": "Technical|OnPage|Content|Schema|CWV",
    "finding": "<what is wrong>",
    "fix": "<exact action to take>",
    "estimated_impact": "High|Medium|Low",
    "effort": "Hours|Days|Weeks",
    "falsifiability_check": "<how to verify this worked>"
  }],
  "executive_summary": "<3 sentences max, plain English>"
}`;

const json = (value) => JSON.stringify(value ?? null, null, 2);

function buildUserPrompt(client, signals) {
  const vars = {
    URL: client.websiteUrl,
    BUSINESS_TYPE: client.businessType,
    CITY: client.city,
    STATE: client.state,
    ON_PAGE_JSON: json(signals.onPage),
    TECHNICAL_JSON: json({ ...signals.technical, robots: signals.robots?.robots, sitemap: signals.robots?.sitemap }),
    CWV_JSON: json(signals.pagespeed),
    SCHEMA_JSON: json(signals.schema),
    GSC_JSON: json(signals.gsc),
    RANKINGS_JSON: json(signals.rankings),
  };
  return USER_PROMPT_TEMPLATE.replace(/\{([A-Z_]+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}

module.exports = { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, buildUserPrompt };

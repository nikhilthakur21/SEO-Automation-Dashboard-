const { Anthropic } = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { USE_MOCKS } = require('../mocks');
const { buildMockAnalysis } = require('../mocks/claude.mock');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompt');
const { AuditResultSchema } = require('./audit-schema');

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

// with USE_MOCKS on, a real key still lets Claude do the analysis
const shouldMockAnalysis = () => USE_MOCKS && !process.env.ANTHROPIC_API_KEY;

async function analyseSignals(client, signals) {
  if (shouldMockAnalysis()) {
    return { result: buildMockAnalysis(client, signals), meta: { analysedBy: 'mock' } };
  }

  try {
    return await askClaude(client, signals);
  } catch (err) {
    // no credit, a bad key or an outage should not fail the whole audit
    const reason = err.error?.error?.message || err.message;
    console.error(`[claude] ${reason}. Using the built-in analysis instead.`);
    return { result: buildMockAnalysis(client, signals), meta: { analysedBy: 'mock', fallbackReason: reason } };
  }
}

async function askClaude(client, signals) {
  const anthropic = new Anthropic();
  const started = Date.now();
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: zodOutputFormat(AuditResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(client, signals) }],
  });

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to analyse this site');
  if (response.stop_reason === 'max_tokens') throw new Error('Claude ran out of output tokens before finishing the report');
  if (!response.parsed_output) throw new Error('Claude did not return a usable JSON report');

  return {
    result: response.parsed_output,
    meta: {
      analysedBy: response.model,
      durationMs: Date.now() - started,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

module.exports = { analyseSignals, MODEL };

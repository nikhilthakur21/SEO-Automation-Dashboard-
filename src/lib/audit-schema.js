const { z } = require('zod/v4');

const score = z.number().int().min(0).max(100);

const Recommendation = z.object({
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.enum(['Technical', 'OnPage', 'Content', 'Schema', 'CWV']),
  finding: z.string(),
  fix: z.string(),
  estimated_impact: z.enum(['High', 'Medium', 'Low']),
  effort: z.enum(['Hours', 'Days', 'Weeks']),
  falsifiability_check: z.string(),
});

const AuditResultSchema = z.object({
  audit_version: z.string(),
  overall_score: score,
  score_breakdown: z.object({
    technical: score,
    on_page: score,
    content: score,
    core_web_vitals: score,
    schema: score,
  }),
  critical_issues: z.array(z.string()).max(5),
  important_issues: z.array(z.string()).max(8),
  quick_wins: z.array(z.string()).max(5),
  recommendations: z.array(Recommendation),
  executive_summary: z.string(),
});

module.exports = { AuditResultSchema };

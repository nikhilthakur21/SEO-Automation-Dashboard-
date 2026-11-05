function scoreTone(score) {
  if (score === null || score === undefined) return 'none';
  if (score >= 90) return 'good';
  if (score >= 50) return 'warn';
  return 'poor';
}

const VERDICTS = { good: 'Healthy', warn: 'Needs work', poor: 'At risk', none: 'Not scored' };

const CATEGORY_LABELS = {
  technical: 'Technical',
  on_page: 'On-page',
  content: 'Content',
  core_web_vitals: 'Core Web Vitals',
  schema: 'Schema',
};

const PRIORITY_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

const RECOMMENDATION_CATEGORIES = {
  Technical: 'Technical',
  OnPage: 'On-page',
  Content: 'Content',
  Schema: 'Schema',
  CWV: 'Core Web Vitals',
};

module.exports = { scoreTone, VERDICTS, CATEGORY_LABELS, PRIORITY_LABELS, RECOMMENDATION_CATEGORIES };

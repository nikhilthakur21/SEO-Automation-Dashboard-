const cheerio = require('cheerio');

const LOCAL_TYPES = [
  'LocalBusiness', 'Dentist', 'MedicalClinic', 'MedicalBusiness', 'Physician', 'Hospital',
  'MedicalOrganization', 'HealthAndBeautyBusiness', 'RealEstateAgent', 'ProfessionalService',
];

const RULES = {
  local: {
    required: ['name', 'address'],
    recommended: ['telephone', 'url', 'geo', 'openingHoursSpecification', 'image', 'priceRange'],
  },
  Organization: { required: ['name', 'url'], recommended: ['logo', 'sameAs', 'contactPoint'] },
  WebSite: { required: ['name', 'url'], recommended: [] },
};

function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (node && Array.isArray(node['@graph'])) return node['@graph'].flatMap(flatten);
  return node && typeof node === 'object' ? [node] : [];
}

function hasValue(item, prop) {
  if (prop === 'openingHoursSpecification') return Boolean(item.openingHoursSpecification || item.openingHours);
  const value = item[prop];
  return value !== undefined && value !== null && value !== '';
}

function checkEntity(item) {
  const types = [].concat(item['@type'] || 'Unknown');
  const isLocal = types.some((t) => LOCAL_TYPES.includes(t));
  const rule = isLocal ? RULES.local : RULES[types[0]];

  return {
    type: types.join(', '),
    isLocalBusiness: isLocal,
    missingRequired: rule ? rule.required.filter((p) => !hasValue(item, p)) : [],
    missingRecommended: rule ? rule.recommended.filter((p) => !hasValue(item, p)) : [],
  };
}

function validateSchema(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  const errors = [];

  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      errors.push(`JSON-LD block ${i + 1} is not valid JSON`);
    }
  });

  const entities = blocks.flatMap(flatten).map(checkEntity);
  const microdataTypes = [
    ...new Set($('[itemtype]').map((_, el) => $(el).attr('itemtype').split('/').pop()).get()),
  ];

  return {
    found: entities.length > 0 || microdataTypes.length > 0,
    jsonLdBlocks: blocks.length,
    types: [...new Set(entities.map((e) => e.type))],
    hasLocalBusiness: entities.some((e) => e.isLocalBusiness) || microdataTypes.some((t) => LOCAL_TYPES.includes(t)),
    entities,
    microdataTypes,
    errors,
  };
}

module.exports = { validateSchema };

/**
 * Commitlint Configuration - Reads from AGENT_CONFIG.json
 * Single source of truth for commit conventions
 */

const fs = require('fs');
const path = require('path');

// Cache config to avoid repeated file reads
let cachedConfig = null;

function loadAgentConfig() {
  if (cachedConfig) return cachedConfig;
  
  const agentConfigPath = path.join(__dirname, 'docs', 'AGENT_CONFIG.json');
  const agentConfig = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
  
  cachedConfig = {
    types: agentConfig.commit_conventions.types.map(t => t.type),
    scopes: agentConfig.commit_conventions.scopes,
    templates: agentConfig.commit_conventions.structured_body_templates,
    footerKeys: agentConfig.commit_conventions.footer_keys
  };
  
  return cachedConfig;
}

/**
 * Validate structured body templates for exp, abandon, arch commits
 */
function validateStructuredBody(parsed) {
  const headerMatch = parsed.header?.match(/^(?<type>[^(:]+)(?:\((?<scope>[^)]+)\))?:/);
  const type = headerMatch?.groups?.type;
  
  if (!type || !['exp', 'abandon', 'arch'].includes(type)) {
    return [true]; // No validation needed for other types
  }
  
  const config = loadAgentConfig();
  const requiredTemplate = config.templates[type];
  
  if (!requiredTemplate || !Array.isArray(requiredTemplate)) {
    return [false, `No template defined for type '${type}'`];
  }
  
  const body = parsed.body || '';
  const missingFields = [];
  
  for (const templateLine of requiredTemplate) {
    const fieldName = templateLine.split(':')[0];
    const fieldRegex = new RegExp(`^${fieldName}:\\s+.+`, 'm');
    
    if (!fieldRegex.test(body)) {
      missingFields.push(fieldName);
    }
  }
  
  if (missingFields.length > 0) {
    return [false, `Missing required fields for '${type}': ${missingFields.join(', ')}`];
  }
  
  // Special validation for experiment commits
  if (type === 'exp') {
    const footer = parsed.footer || '';
    if (!/^Experiment-ID:\s+\S+/m.test(footer)) {
      return [false, 'Experiment commits require "Experiment-ID: <id>" in footer'];
    }
  }
  
  return [true];
}

const config = loadAgentConfig();

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Use types from AGENT_CONFIG.json
    'type-enum': [2, 'always', config.types],
    // Use scopes from AGENT_CONFIG.json  
    'scope-enum': [2, 'always', config.scopes],
    // Keep reasonable header length
    'header-max-length': [2, 'always', 100],
    // Allow empty scope for some commit types
    'scope-empty': [0, 'never'],
    // Subject formatting - allow lowercase start
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
  },
  plugins: [
    {
      rules: {
        'structured-body-required': validateStructuredBody,
      },
    },
  ],
  // Enable custom rule
  'structured-body-required': [2, 'always'],
};
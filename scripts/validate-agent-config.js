#!/usr/bin/env node
/**
 * Validation script for AGENT_CONFIG.json
 * Ensures the agent configuration file is valid and contains all required fields
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'AGENT_CONFIG.json');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateConfig() {
  log('🔍 Validating AGENT_CONFIG.json...', 'blue');
  
  // Check if file exists
  if (!fs.existsSync(CONFIG_FILE)) {
    log('❌ AGENT_CONFIG.json not found!', 'red');
    process.exit(1);
  }
  
  let config;
  try {
    const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(fileContent);
  } catch (error) {
    log(`❌ Failed to parse AGENT_CONFIG.json: ${error.message}`, 'red');
    process.exit(1);
  }
  
  const errors = [];
  const warnings = [];
  
  // Validate required top-level sections
  const requiredSections = [
    'meta',
    'quality_gates',
    'documentation_maintenance',
    'execution_workflow',
    'code_conventions',
    'testing_requirements',
    'security_requirements'
  ];
  
  requiredSections.forEach(section => {
    if (!config[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  });
  
  // Validate meta section
  if (config.meta) {
    ['version', 'project', 'description'].forEach(field => {
      if (!config.meta[field]) {
        errors.push(`Missing required field: meta.${field}`);
      }
    });
  }
  
  // Validate quality gates
  if (config.quality_gates) {
    if (config.quality_gates.test_coverage) {
      const coverage = config.quality_gates.test_coverage.business_logic_minimum;
      if (typeof coverage !== 'number' || coverage < 0 || coverage > 100) {
        errors.push('Invalid test coverage value (must be 0-100)');
      }
    }
    
    if (config.quality_gates.bundle_size) {
      const maxSize = config.quality_gates.bundle_size.max_kb_per_route;
      if (typeof maxSize !== 'number' || maxSize <= 0) {
        errors.push('Invalid bundle size limit');
      }
    }
  }
  
  // Validate documentation maintenance
  if (config.documentation_maintenance) {
    if (!Array.isArray(config.documentation_maintenance.immediate_update_triggers)) {
      errors.push('immediate_update_triggers must be an array');
    } else {
      config.documentation_maintenance.immediate_update_triggers.forEach((trigger, index) => {
        if (!trigger.event || !trigger.required_updates) {
          errors.push(`Invalid trigger at index ${index}: missing event or required_updates`);
        }
      });
    }
  }
  
  // Validate execution workflow
  if (config.execution_workflow) {
    if (!Array.isArray(config.execution_workflow.mandatory_steps)) {
      errors.push('mandatory_steps must be an array');
    } else {
      const steps = config.execution_workflow.mandatory_steps;
      const stepNumbers = steps.map(s => s.step);
      
      // Check for sequential steps
      for (let i = 0; i < stepNumbers.length; i++) {
        if (stepNumbers[i] !== i + 1) {
          warnings.push(`Non-sequential step number: ${stepNumbers[i]}`);
        }
      }
      
      // Validate each step
      steps.forEach(step => {
        if (!step.name || !step.actions || !step.validation) {
          errors.push(`Invalid step ${step.step}: missing required fields`);
        }
      });
    }
  }
  
  // Check for current project values
  if (config.quality_gates?.performance_metrics) {
    const metrics = config.quality_gates.performance_metrics;
    
    // Validate against known project metrics
    if (metrics.api_call_reduction_percent !== 75) {
      warnings.push(`API call reduction is set to ${metrics.api_call_reduction_percent}%, but project achieves 75%`);
    }
    
    if (metrics.cache_hit_rate_percent !== 99) {
      warnings.push(`Cache hit rate is set to ${metrics.cache_hit_rate_percent}%, but project achieves 99.99%`);
    }
  }
  
  // Check test coverage alignment
  if (config.quality_gates?.test_coverage) {
    const businessLogicMin = config.quality_gates.test_coverage.business_logic_minimum;
    if (businessLogicMin !== 78) {
      warnings.push(`Business logic coverage minimum is ${businessLogicMin}%, current project has ~78%`);
    }
  }
  
  // Output results
  log('\n📊 Validation Results:', 'blue');
  
  if (errors.length === 0) {
    log('✅ No errors found!', 'green');
  } else {
    log(`❌ Found ${errors.length} error(s):`, 'red');
    errors.forEach(error => log(`  - ${error}`, 'red'));
  }
  
  if (warnings.length > 0) {
    log(`\n⚠️  Found ${warnings.length} warning(s):`, 'yellow');
    warnings.forEach(warning => log(`  - ${warning}`, 'yellow'));
  }
  
  // Summary
  log('\n📈 Configuration Summary:', 'blue');
  log(`  Version: ${config.meta?.version || 'Unknown'}`);
  log(`  Project: ${config.meta?.project || 'Unknown'}`);
  log(`  Quality Gates: ${Object.keys(config.quality_gates || {}).length}`);
  log(`  Workflow Steps: ${config.execution_workflow?.mandatory_steps?.length || 0}`);
  log(`  Documentation Triggers: ${config.documentation_maintenance?.immediate_update_triggers?.length || 0}`);
  
  // Exit with appropriate code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
validateConfig();
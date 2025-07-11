# QUICK_FIX_COMMAND_V1.1

---BEGIN_CONFIG---
# PURPOSE
# Ultra-focused, time-boxed command for minimal invasive fixes.
# Auto-escalates to /task-breakdown if complexity exceeds thresholds.
purpose: "Solve problems with the absolute minimum change required"
max_execution_iterations: 8  # Hard stop to prevent overengineering
---END_CONFIG---

---BEGIN_CONFIG---
# LLM_ROLES
gemini_2_5_pro: Architektur # Strategischer Architekt & Tiefenanalyst
o3_o3_mini: Codequalität # Präzisionsingenieur & Detail-Optimierer
claude: Koordination # Orchestrierung, Kontextmanagement, Feedback-Synthese, Planungs-Generierung
---END_CONFIG---

---BEGIN_CONFIG---
# ESCALATION_THRESHOLDS
# Auto-escalate to /task-breakdown if ANY threshold exceeded

estimated_files_changed: 2  # >2 files = escalate
estimated_lines_of_code: 30  # >30 lines = escalate
new_dependencies_required: 0  # ANY new dependency (1) = escalate
affects_database_schema: 0  # 1 = escalate, 0 = continue
security_implications_found: 0  # 1 = escalate, 0 = continue
major_refactoring_identified: 0  # 1 = escalate, 0 = continue
architecture_changes_needed: 0  # 1 = escalate, 0 = continue
root_cause_unclear: 0  # 1 = escalate, 0 = continue
---END_CONFIG---

---BEGIN_CONFIG---
# KISS_ENFORCEMENT_RULES
# These must be checked at every step

- rule: "use_existing_patterns"
  question: "Nutze ich bereits existierende Funktionen/Patterns?"
  escalate_if: false
- rule: "minimal_scope"
  question: "Kann ich das Problem mit <3 Dateien lösen?"
  escalate_if: false
- rule: "no_new_architecture"
  question: "Brauche ich neue Klassen/Services/Module?"
  escalate_if: true
- rule: "quick_testable"
  question: "Kann ich das in <5 Minuten testen?"
  escalate_if: false
- rule: "reversible_change"
  question: "Kann ich die Änderung leicht rückgängig machen?"
  escalate_if: false
---END_CONFIG---

---BEGIN_CONFIG---
# QUALITY_GATE_EXECUTION
# Real commands that must be executed after each file change
mandatory_commands:
  - command: "npm run build"
    purpose: "Verify compilation success"
    timeout_seconds: 60
    failure_action: "escalate"
  - command: "npm run typecheck"
    purpose: "Verify type safety"
    timeout_seconds: 30
    failure_action: "escalate"
  - command: "npm run lint"
    purpose: "Verify code standards"
    timeout_seconds: 30
    failure_action: "escalate"
---END_CONFIG---

---BEGIN_CONFIG---
# SIMULATION_TEMPLATES
# Quick examples for missing context

simple_bug: "TypeError: Cannot read property 'value' of null at line 42"
ui_issue: "Button click handler not firing on mobile Safari"
data_issue: "Form validation failing for valid email addresses"
performance_issue: "Page load time increased from 2s to 8s after last deploy"
---END_CONFIG---

---

# QUICK_FIX_WORKFLOW

### **Command Usage:**
* **`/quick-fix [problem-description]`**: Fix specific problem with minimal approach
* **`/quick-fix`** (without args): Fix last discussed problem in context

---

## 1. Lightning Analysis & Escalation Check

### _STEP_ 1.1. Problem Identification (Max. 1 interne Analyse-Iteration)
* **_ACTION_** Parse problem description and identify the core issue in one sentence
* **_ACTION_** Locate most likely source (file/function/component)
* **_ACTION_** **Fallback**: If no context provided, simulate using `SIMULATION_TEMPLATES`

### _STEP_ 1.2. Escalation Check (Max. 1 interne Analyse-Iteration)
* **_ACTION_** Evaluate against `ESCALATION_THRESHOLDS`
* **_ACTION_** Apply `KISS_ENFORCEMENT_RULES` checks
* **_ACTION_** **IF ANY threshold exceeded OR KISS rule violated:**
  ```markdown
  🚨 **AUTO-ESCALATION TRIGGERED**
  Reason: [specific threshold/rule violated]
  
  This problem requires more comprehensive analysis.
  **Next Step:** Use `/task-breakdown [your-problem]` for full Multi-LLM approach.
  ```
  **STOP execution here.**

---

## 2. Minimal Solution Design

### _STEP_ 2.1. Root Cause Hypothesis (Max. 1 interne Analyse-Iteration)
* **_ACTION_** Identify most likely cause based on problem symptoms
* **_ACTION_** **IF cause unclear after 1 interne Analyse-Iteration:**
  ```markdown
  🚨 **AUTO-ESCALATION TRIGGERED**
  Reason: Root cause unclear after initial analysis. This needs comprehensive analysis.
  **Next Step:** Use `/task-breakdown [your-problem]` for full Multi-LLM approach.
  ```
  **STOP execution here.**

### _STEP_ 2.2. Minimal Fix Strategy (Max. 2 interne Analyse-Iterationen)
* **_ACTION_** Design fix using existing code/patterns only
* **_ACTION_** Ensure fix targets root cause, not symptoms
* **_ACTION_** **Double-check**: Does this violate any `KISS_ENFORCEMENT_RULES`? If yes, AUTO-ESCALATE

### _STEP_ 2.3. Change Planning (Max. 1 interne Analyse-Iteration)
* **_ACTION_** List specific files and lines to change
* **_ACTION_** Verify changes stay within `ESCALATION_THRESHOLDS`
* **_ACTION_** **IF thresholds exceeded:** AUTO-ESCALATE

---

## 3. Quality Validation

### _STEP_ 3.1. Mandatory Quality Gates Execution (Max. 1 interne Analyse-Iteration)
* **_ACTION_** Nach der Planung einer jeden signifikanten Code-Änderung:

* **_TOOL_CALL_** `bash "npm run build"`
* **_ACTION_** **IF exit code != 0:**
  ```markdown
  🚨 **AUTO-ESCALATION TRIGGERED**
  Reason: Build failed for planned changes.
  
  Build Output:
  ```
  [command output]
  ```
  
  **Next Step:** Use `/task-breakdown [your-problem]` for comprehensive analysis.
  ```
  **STOP execution here.**

* **_TOOL_CALL_** `bash "npm run typecheck"`
* **_ACTION_** **IF exit code != 0:**
  ```markdown
  🚨 **AUTO-ESCALATION TRIGGERED**
  Reason: TypeCheck failed for planned changes.
  
  TypeCheck Output:
  ```
  [command output]
  ```
  
  **Next Step:** Use `/task-breakdown [your-problem]` for comprehensive analysis.
  ```
  **STOP execution here.**

* **_TOOL_CALL_** `bash "npm run lint"`
* **_ACTION_** **IF exit code != 0:**
  ```markdown
  🚨 **AUTO-ESCALATION TRIGGERED**
  Reason: Linting failed for planned changes.
  
  Lint Output:
  ```
  [command output]
  ```
  
  **Next Step:** Use `/task-breakdown [your-problem]` for comprehensive analysis.
  ```
  **STOP execution here.**

### _FALLBACK_ **IF bash tools not available:**
* **_ACTION_** Display commands for manual execution:
  ```markdown
  ⚠️ **Manual Quality Gates Required**
  
  Please run these commands manually after implementing changes:
  ```bash
  npm run build
  npm run typecheck
  npm run lint
  ```
  
  **All commands must pass before considering fix complete.**
  ```

### _STEP_ 3.2. Optional O3 Code Review (Auto-triggered if security/performance)
* **_TRIGGER_** Auto-triggered if:
  - Problem involves auth/validation/data handling
  - Performance-critical code paths
  - Estimated change >15 lines
* **_ACTION_** **IF triggered:** Quick O3 review focusing on immediate code quality issues
* **_TOOL_CALL_** `o3_chat "Quick code review for minimal fix: [planned changes]. Focus: syntax, immediate bugs, security red flags." max_tokens=2000`

---

## 4. Solution Output

### _OUTPUT_FORMAT_

```markdown
## 🔧 Quick Fix Solution

**Problem:** [One sentence describing the issue]
**Root Cause:** [One sentence explaining why it happens]
**Minimal Fix:** [One sentence describing the solution approach]

### 📝 Changes Required:

**File:** `path/to/file.ext`
- **Line [X]:** Change `old code` → `new code`
- **Reason:** [Brief explanation why this fixes the root cause]

[Repeat for each file, max 2 files]

### ✅ Quality Validation Results:
- [x] Build: ✅ SUCCESS (0.8s)
- [x] TypeCheck: ✅ SUCCESS (0.3s)
- [x] Lint: ✅ SUCCESS (0.2s)

**All quality gates passed!** Fix is ready for deployment.

### 🧪 Testing:
- **Manual Test:** [Specific steps to verify fix works]
- **Regression Check:** [Quick check that nothing else broke]

### 📊 Fix Metrics:
- **Files changed:** [X]/2 allowed
- **Lines changed:** [X]/30 allowed
- **Complexity:** ⭐ Minimal
- **Estimated time:** [X] minutes

### 🔄 Rollback Plan:
[How to undo this change if problems occur]
```

---

## 5. Emergency Escalation Patterns

### _AUTO_ESCALATION_TRIGGERS_

**During any step, immediately escalate if:**

```markdown
🚨 **ESCALATION: [Reason]**

**Problem analysis shows:**
- [Specific threshold violated, e.g., "Affects 4 files (threshold: 2)"]
- [Specific KISS rule violated, e.g., "Requires new service class"]
- [Quality gate failure, e.g., "TypeCheck failed with 3 errors"]

**This needs comprehensive planning.**
**Recommended:** `/task-breakdown [original-problem]`

**Why escalation is needed:**
[Brief explanation of complexity discovered]
```

---

## 6. Integration with Command Suite

```mermaid
flowchart TD
    A[User has problem] --> B[/evaluate optional]
    B --> C{Score 0-2?}
    C -->|Yes| D[/quick-fix]
    C -->|No| E[/task-breakdown]
    
    D --> F{Quality Gates Pass?}
    F -->|Yes| G[Quick solution]
    F -->|No| H[Auto-escalate to /task-breakdown]
    
    E --> I[Full analysis]
```

### _USAGE_PATTERNS_

- **Direct usage:** Known simple problem → `/quick-fix`
- **After evaluation:** `/evaluate` recommends simple → `/quick-fix`
- **Auto-escalation:** `/quick-fix` discovers complexity → `/task-breakdown`

### _SUCCESS_METRICS_

- ✅ **95%+ of fixes** should complete without escalation
- ✅ **<30 lines of code** changed per fix
- ✅ **<5 minutes** manual testing time
- ✅ **Zero breaking changes** in production
- ✅ **100% quality gate compliance** (build, typecheck, lint must pass)

---

**Benutzeranfrage (Beschreibung des Problems):** [Fügen Sie hier die ursprüngliche Beschreibung des Problems durch den Benutzer ein]
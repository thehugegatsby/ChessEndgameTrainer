# EVALUATE_COMMAND_PROMPT_V1.1

🎯 Purpose
Analyze task complexity and recommend the optimal approach before starting the actual workflow. This eliminates guesswork and ensures the right tool for the job.
The output of this command is purely analytical and does not trigger any further planning or implementation steps automatically.

🔧 Command Usage
/evaluate [task-description]     # Analyze specific task
/evaluate                        # Analyze last discussed task in context

---
# LLM_ROLES

gemini_2_5_pro: Architecture # Strategischer Architekt & Tiefenanalyst
o3_o3_mini: Codequalität # Präzisionsingenieur & Detail-Optimierer
claude: Koordination # Orchestrierung, Kontextmanagement, Feedback-Synthese, Planungs-Generierung.

---
# COMPLEXITY_SCORING_RULES

# Regeln zur automatischen Komplexitätsbewertung eines Tasks.
# Punkte werden addiert.

- keyword_match: "crash"
  points: 2
  examples: ["System crashes", "Anwendung stürzt ab"]
- keyword_match: "security"
  points: 2
  examples: ["Sicherheitslücke", "Authentifizierungsfehler", "Vulnerability"]
- keyword_match: "performance"
  points: 2
  examples: ["Langsam", "Performance-Engpass"]
- keyword_match: "vulnerability"
  points: 2
  examples: ["Sicherheitslücke", "Injection", "Cross-Site Scripting"]
- keyword_match: "multiple_components"
  keywords: ["mehrere Komponenten", "API und Datenbank", "Frontend und Backend", "cross-service"]
  points: 2
  examples: ["API und Datenbank synchronisieren nicht", "Frontend und Backend Problem"]
- keyword_match: "system_level_terms"
  keywords: ["microservice", "authentication flow", "database schema", "API gateway", "load balancer", "kubernetes", "cloud infrastructure", "distributed system"]
  points: 2
- keyword_match: "uncertainty"
  keywords: ["manchmal", "zufällig", "intermittierend", "sporadisch", "unklar"]
  points: 1
- keyword_match: "hidden_feature_request"
  keywords: ["sollte können", "wäre gut wenn", "fehlende Funktion"]
  points: 2

---
# WORKFLOW_DECISION_THRESHOLDS

# Schwellenwerte für die Empfehlung des Workflows basierend auf dem Komplexitäts-Score.

- score_range: "0-2"
  recommendation: "Simple Fix Approach"
  description: "Looks like a straightforward task/fix that can be solved with minimal changes."
  next_step_command: "/fix [your-task]" # Hypothetischer Befehl für eine 'Lite'-Version
- score_range: "3-4"
  recommendation: "Needs Assessment"
  description: "This task has some complexity indicators but might still be manageable with a simple approach, or could benefit from a full analysis."
  next_step_command_options:
    - "/fix [your-task] (will auto-escalate if needed)" # Hypothetischer Befehl
    - "/task-breakdown [your-task] (for comprehensive analysis)"
- score_range: "5+"
  recommendation: "Complex Analysis"
  description: "This task involves multiple systems/components and requires careful planning and a full Multi-LLM approach."
  next_step_command: "/task-breakdown [your-task]"

---
# EVALUATION_WORKFLOW_STEPS

1.  **Quick Task Analysis (Max. 2 interne Analyse-Iterationen)**
    * 📝 Parse and understand the task description.
    * 🔍 Identify key components, scope, and objectives.
    * ❓ Note any missing information or ambiguities.

2.  **Complexity Scoring (Max. 1 interne Analyse-Iteration)**
    * Apply scoring rules systematically based on `COMPLEXITY_SCORING_RULES` to the task description. Calculate total score.

3.  **Context Assessment (Max. 2 interne Analyse-Iterationen)**
    * 🏗️ Architecture Impact: Does this affect system design? (Infer based on task and known architecture patterns.)
    * 📁 File Scope: How many files likely affected? (Estimate based on task scope.)
    * 🔗 Dependencies: New dependencies or integrations needed? (Infer from task.)
    * 🛡️ Security Implications: Any auth/data security concerns? (Infer from task.)

4.  **Workflow Recommendation (Max. 1 interne Analyse-Iteration)**
    * Based on the total complexity score, apply `WORKFLOW_DECISION_THRESHOLDS` to determine the recommendation.

---
# OUTPUT_FORMAT

## 📊 Task Complexity Evaluation

**Task Summary:** [One-sentence description of what needs to be done]

**Complexity Score:** [X] points
**Recommended Approach:** [Simple Fix Approach | Needs Assessment | Complex Analysis]

### 🔍 Scoring Breakdown:
- [Keyword/Pattern]: +[X] points ([Reason])
- [Keyword/Pattern]: +[X] points ([Reason])
- **Total:** [X] points

### 🎯 Assessment Details:
- **Scope:** [1-2 files | 3-5 files | >5 files | Unknown]
- **Architecture Impact:** [None | Minimal | Moderate | Significant]
- **Dependencies:** [None | Existing only | New required]
- **Security Implications:** [None detected | Possible | Confirmed]

### 💡 Recommendation:

**IF Simple Fix (0-2 points):**
✅ Use Simple Approach
[Description from `WORKFLOW_DECISION_THRESHOLDS`]
Next Step: Use `[recommended_command]` for a quick, focused solution.

**IF Needs Assessment (3-4 points):**
⚠️ Borderline Complexity
[Description from `WORKFLOW_DECISION_THRESHOLDS`]
Options:
- Try `[option1_command]` (will auto-escalate if needed)
- Use `[option2_command]` (for comprehensive analysis)

**IF Complex Analysis (5+ points):**
🔴 Complex Task Detected
[Description from `WORKFLOW_DECISION_THRESHOLDS`]
Next Step: Use `[recommended_command]` for full Multi-LLM analysis.

### 🚨 Red Flags Detected:
[List any concerning patterns that suggest high complexity, e.g., "Intermittent bug," "Security keyword detected."]

### 💭 Confidence Level: [High | Medium | Low]
[Brief explanation of confidence in this assessment based on available information/clarity of task.]

---
# INTEGRATION_WITH_EXISTING_COMMANDS

```mermaid
flowchart TD
    A[User has task] --> B[/evaluate task]
    B --> C{Complexity Score}
    
    C -->|0-2 points| D[/fix - Simple approach]
    C -->|3-4 points| E[User choice: /fix or /task-breakdown]
    C -->|5+ points| F[/task-breakdown - Full analysis]
    
    D --> G[Quick solution]
    E --> H[Appropriate solution]
    F --> I[Comprehensive solution]
````

-----

# USAGE\_TIPS

  * Start with `/evaluate` for any non-trivial task.
  * Trust the assessment - it's based on proven patterns.
  * Use the recommended next command for best results.
  * Re-evaluate if task scope changes during work.

-----

**Benutzeranfrage (Beschreibung des Tasks):** [Fügen Sie hier hier die ursprüngliche Beschreibung des Tasks durch den Benutzer ein]

```
```
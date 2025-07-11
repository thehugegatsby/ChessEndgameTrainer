# CONTROLLER_PROMPT_V5.1 (ULTIMATIVE LLM-OPTIMIERUNG FÜR PARSING)

---BEGIN_CONFIG---
mode: planung # {planung|umsetzungs-review|hybrid}
# Beschreibt den aktuellen Ausführungsmodus für Claude.
---END_CONFIG---

---BEGIN_CONFIG---
# LLM_ROLES
gemini_2_5_pro: Architektur # Strategischer Architekt & Tiefenanalyst
o3_o3_mini: Codequalität # Präzisionsingenieur & Detail-Optimierer
claude: Koordination # Orchestrierung, Kontextmanagement, Feedback-Synthese, Planungs-Generierung.
---END_CONFIG---

---BEGIN_CONFIG---
# LLM_CONFIGURATION
max_tokens_per_llm_call: 8000 # Maximales Token-Budget pro Aufruf an Gemini oder O3/O3 mini.
---END_CONFIG---

---BEGIN_CONFIG---
# COMPLEXITY_SCORE_RULES
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
- keyword_match: "multiple_components" # Wenn Task/Bug mehrere Systemteile explizit erwähnt
  keywords: ["mehrere Komponenten", "API und Datenbank", "Frontend und Backend", "cross-service"]
  points: 2
  examples: ["API und Datenbank synchronisieren nicht", "Frontend und Backend Problem"]
- keyword_match: "system_level_terms" # Konkrete Systemebenen-Begriffe
  keywords: ["microservice", "authentication flow", "database schema", "API gateway", "load balancer", "kubernetes", "cloud infrastructure", "distributed system"]
  points: 2
- keyword_match: "uncertainty" # Indikatoren für unklare Reproduzierbarkeit oder intermittierende Fehler
  keywords: ["manchmal", "zufällig", "intermittierend", "sporadisch", "unklar"]
  points: 1
- keyword_match: "hidden_feature_request" # Wenn der Bug eigentlich ein Feature-Request ist
  keywords: ["sollte können", "wäre gut wenn", "fehlende Funktion"]
  points: 2
---END_CONFIG---

---BEGIN_CONFIG---
# DECISION_LOGIC
# Logik zur Wahl des Workflows basierend auf dem Komplexitäts-Score.

- condition: "complexity_score <= 2"
  workflow_path: "enhanced_fix_workflow"
- condition: "complexity_score >= 3"
  workflow_path: "multi_llm_deep_dive_workflow"

# De-Eskalations-Logik (innerhalb des Deep-Dive Workflows evaluieren)
# Beispiel:
# - condition: "task_is_simple_after_deep_dive_analysis == true"
#   action: "switch_to_enhanced_fix"
---END_CONFIG---

---BEGIN_CONFIG---
# ESCALATION_THRESHOLDS
# Objektive Schwellenwerte für die Auto-Eskalation vom Enhanced Fix zum Deep-Dive Workflow.
# Werte sind Schwellen: > X löst Eskalation aus.
# Booleans: 1 für Ja/True, 0 für Nein/False.

estimated_files_changed: 3 # >3 Dateien
estimated_lines_of_code: 50 # >50 Zeilen Code
new_dependencies_required: 1 # >1 neue Abhängigkeit
affects_database_schema: 0 # 1, wenn Schema-Änderungen betroffen sind, sonst 0
security_implications_found: 0 # 1, wenn Sicherheitsimplikationen gefunden, sonst 0
major_refactoring_identified: 0 # 1, wenn in der Analyse als großes Refactoring erkannt, sonst 0
root_cause_unclear_after_analysis: 0 # 1, wenn Wurzelursache nach Quick Analysis unklar bleibt, sonst 0
---END_CONFIG---

---BEGIN_CONFIG---
# QUALITY_GATE_CHECKS_DEFINITION
# Regeln für die simulierte Ausführung von Qualitäts-Gates.
# Claude soll diese Checks auf den *vorgeschlagenen Code-Änderungen* simulieren.

- check_imports: "Sind alle import/require Statements syntaktisch korrekt und vorhanden?"
- check_types: "Entsprechen Variable-Zuweisungen den Datentypen (z.B. TypeScript)?"
- check_syntax: "Gibt es offensichtliche Syntax-Fehler (fehlende Klammern, Semikolons etc.)?"
- check_linting: "Werden gängige Linting-Regeln (Einrückung, Namenskonventionen) eingehalten?"
- check_dependencies: "Sind alle neuen/geänderten Abhängigkeiten im Build-System korrekt deklariert?"
---END_CONFIG---

---BEGIN_CONFIG---
# LLM_ROUTING_RULES
# Regeln für die Zuweisung von LLMs basierend auf dem Task-Inhalt oder dem Review-Fokus.
# Die erste passende Regel wird angewendet.
# 'route_to': "gemini_only" | "o3_only" | "both"

- if_task_contains_keywords: ["architecture", "system", "design pattern", "scalability", "deployment", "infrastructure", "microservice", "database schema"]
  route_to: "gemini_only"
- if_task_contains_keywords: ["component", "function", "method", "class", "algorithm", "data structure", "optimization", "code style", "unit test", "bug fix"]
  route_to: "o3_only"
- if_task_contains_keywords: ["API", "interface", "integration", "security", "validation", "error handling", "performance critical path"]
  route_to: "both"
- default_route: "both" # Fallback, wenn keine spezifische Regel zutrifft
---END_CONFIG---

---BEGIN_CONFIG---
# REVIEW_CONTEXTS_AND_CHECKLISTS
# Definitionen für Planungs- und Umsetzungs-Reviews.

planning_review:
  goal: "Überprüfe, ob der geplante Schritt die Gesamtarchitektur respektiert, gut wartbar ist und keine technischen oder sicherheitsrelevanten Probleme einführt."
  focus: "Architektur-Konformität, Entkopplung, Testbarkeit, Sicherheit, Effizienz."
  checklist:
    - Architektur respektiert?
    - Verursacht er keine unerwünschten Kopplungen?
    - Ist er effizient, wartbar und testbar?
    - Birgt er Sicherheitsrisiken oder potenzielle Regression?

implementation_review:
  goal: "Analysiere die bereits umgesetzte Maßnahme auf Qualität, saubere Implementierung, Einhaltung der Planung und Testabdeckung."
  focus: "Clean Code, Modultiefe, Dokumentation, Testbarkeit."
  checklist:
    - Entspricht die Umsetzung dem ursprünglichen Plan?
    - Ist der Code klar, modular und dokumentiert?
    - Wurden Clean Code / Best Practices eingehalten?
    - Ist die Maßnahme ausreichend getestet?
---END_CONFIG---

---BEGIN_CONFIG---
# SIMULATION_TEMPLATES
# Beispiele für simulierte Daten, die Claude generieren kann, wenn realer Kontext fehlt.

error_log: "2025-07-11 23:59:01 ERROR [UserService] Failed to authenticate user 'testuser': Connection timeout to AuthDB."
stack_trace: "at com.example.app.UserService.authenticate(UserService.java:42)\n\tat com.example.app.AuthController.login(AuthController.java:88)\n\t..."
code_snippet: "function calculateDiscount(price, userType) { /* complex logic */ }"
config_snippet: "database:\n  host: localhost\n  port: 5432"
---END_CONFIG---

---BEGIN_CONFIG---
# KONFLIKT_RESOLUTION_FRAMEWORK
# Diese Regeln werden von Claude bei widersprüglichem Feedback genutzt.

- konflikt_type: "Security vs Performance"
  auto_rule: "Security gewinnt"
  example: "Validation kostet Performance -> Validation bleibt"
- konflikt_type: "Maintainability vs Speed"
  auto_rule: "Maintainability gewinnt"
  example: "Refactor dauert länger -> Refactor machen"
- konflikt_type: "Existing Pattern vs New Pattern"
  auto_rule: "Existing gewinnt"
  example: "Neue vs bestehende Architektur -> Bestehende nutzen"
- konflikt_type: "Minimal vs Comprehensive"
  auto_rule: "Minimal gewinnt (im Enhanced Fix)"
  example: "3 Zeilen vs 30 Zeilen -> 3 Zeilen"
---END_CONFIG---

---
# START_WORKFLOW_EXECUTION

# Dies ist der Startpunkt für Claudes Ausführung des Workflows.

### **Initialisierung des Task-Planungs-Prozesses:**

* **_ACTION_** `current_task_description` setzen:
    * **IF** Befehl `/task-breakdown [Task-Beschreibung]` mit Argumenten aufgerufen: Nutze die mitgelieferte Beschreibung.
    * **ELSE IF** Befehl `/task-breakdown` ohne Argumente aufgerufen: Ermittle den **zuletzt besprochenen oder im Kontext liegenden Task**.
    * **ELSE** (Falls unklar): Informiere Benutzer und frage nach Spezifikation, dann beende den Prozess.

---
## 1. Task-Verständnis & Komplexitäts-Analyse

### _STEP_ 1.1. Task-Analyse
* **_ACTION_** Analysiere `current_task_description`. Formuliere Hypothesen zu Zielen, Ressourcen, Herausforderungen. Identifiziere fehlende Infos.

### _STEP_ 1.2. Kontext- und Informationssammlung
* **_ACTION_** Identifiziere relevante Daten (Doku, Code, Konfigs).
* **_ACTION_** **Fallback-Verhalten:** Falls keine Daten bereitgestellt, **simuliere umgehend typische relevante Daten** für den Task (Nutze `SIMULATION_TEMPLATES`) und nutze diese.
* **_ACTION_** **Architektur-Kontextbeschaffung:**
    * **Prüfe:** Ist ausreichender Kontext zur Systemarchitektur und Design-Intentionen vorhanden?
    * **Wenn unzureichend:** Nutze `Google Search` für relevante Architekturen, Design-Prinzipien, Best Practices für den Task-Typ.
    * **Markierung simulierter Bereiche:** Wenn Daten oder Architektur-Kontext simuliert wurden, kennzeichne diese klar im Kontext, den du später LLMs präsentierst.

### _STEP_ 1.3. Interne Analyse & Komplexitäts-Bewertung
* **_ACTION_** Analysiere gesammelte (oder simulierte) Daten unter Berücksichtigung des Architektur-Kontextes. Identifiziere Herausforderungen und grobe Lösungsansätze.
* **_ACTION_** **Bewerte die Task-Komplexität:** Addiere die Punkte der `COMPLEXITY_SCORE_RULES` basierend auf dem Task-Inhalt.
* **_ACTION_** **Leite den `workflow_path` ab** basierend auf `DECISION_LOGIC`.

---
## 2. Dynamischer Workflow-Pfad

### _IF_ `workflow_path` == "enhanced_fix_workflow"

#### _SUB-WORKFLOW_ Enhanced Fix (EF)

2.1. **EF: Problem-Analyse (Max. 2 interne Analyse-Iterationen):**
    * **_ACTION_** 🔍 Identifiziere das exakte Problem und die wahrscheinliche Stelle.
    * **_ACTION_** 📄 Prüfe relevante Code-Dateien (simuliert).
    * **_ACTION_** 🎯 Fokus auf minimalen Scope für den Fix/die Task-Umsetzung.

2.2. **EF: Anti-Overengineering Check (Max. 1 interne Analyse-Iteration):**
    * **_ACTION_** **Auto-Eskalations-Trigger:** Prüfe die geschätzten Parameter des geplanten Fixes gegen `ESCALATION_THRESHOLDS`.
    * **_ACTION_** **IF** ein Trigger ausgelöst wird: Setze `workflow_path` auf "multi_llm_deep_dive_workflow" und fahre direkt mit Schritt 2.3 fort.

2.3. **EF: Implementierungsstrategie (Max. 3 interne Analyse-Iterationen):**
    * **_ACTION_** 🎯 Plane einen minimal chirurgischen Fix/Task-Umsetzung mit bestehenden Patterns.
    * **_ACTION_** 📝 Sorge für klare Dokumentation der geplanten Änderungen.
    * **_ACTION_** 🧪 Stelle sicher, dass der Plan keine Breaking Changes verursacht.

2.4. **EF: Mandatory Quality Gates (Simulierte Ausführung):**
    * **_ACTION_** Nach der Planung einer jeden signifikanten Code-Änderung:
        * **Führe eine interne Analyse der geplanten Code-Änderung durch** basierend auf `QUALITY_GATE_CHECKS_DEFINITION`.
        * **🛑 STOPP** die Weiterführung des Enhanced Fix Workflows, wenn die Analyse einen Fehler meldet (z.B. Import-Fehler, Syntax-Fehler). Setze `workflow_path` auf "multi_llm_deep_dive_workflow" und fahre direkt mit Schritt 2.3 fort.

2.5. **EF: Optional O3 Review (Auto-getriggert):**
    * **_ACTION_** **Auto-getriggert bei:** Geschätzter Umfang der Änderung > 20 Zeilen Code; Security-relevant (Auth, Validation, Daten); Performance-kritische Pfade.
    * **_ACTION_** Führe ein spezialisiertes O3-Review für den geplanten Schritt durch (Details in 4.1).

### _ELSE_ (Wenn `workflow_path` == "multi_llm_deep_dive_workflow")

#### _SUB-WORKFLOW_ Multi-LLM Deep-Dive (DD)

3.1. **DD: Umfassende Datensammlung:**
    * **_ACTION_** Sammle: Real/Simulierte Daten (Error Logs, Stack Traces, Reproduktionsschritte (falls Bug); existierende Doku, relevante Code-Ausschnitte, Systembeschreibungen (falls Task)).
    * **_ACTION_** Architektur-Recherche: Nutze `Google Search` für System-Architektur, Design-Patterns, Best Practices.
    * **_ACTION_** Dependency-Analyse: Mappe System-Interaktionen und Abhängigkeiten.

3.2. **DD: Multi-LLM Strategische Analyse:**
    * **_REVIEW_** Präsentiere die Zusammenfassung des Tasks, der Daten, deiner Analyse/Hypothese, des Architektur-Kontextes und der Systemabhängigkeiten an **Gemini 2.5 Pro (Architektur)** und **O3/O3 mini (Codequalität)**.
    * **_TOOL_CALL_** `gemini_chat "Analysiere diese Architektur: [Kontext]. Fokus auf [Architektur-Implikationen, Wurzelursachen-Analyse, Langzeit-Strategie]." max_tokens=[LLM_CONFIGURATION.max_tokens_per_llm_call]`
    * **_TOOL_CALL_** `o3_chat "Analysiere diese technischen Details: [Kontext]. Fokus auf [Implementierungs-Details, Security Review, Code-Qualität]." max_tokens=[LLM_CONFIGURATION.max_tokens_per_llm_call]`
    * **_SYNTHESIZE_** Synthetisiere das Feedback. **Widerspruchsbehandlung:** Bei widersprüglichem Feedback: Identifiziere Argumente, bewerte kritisch, triff **begründete Entscheidung für den BESTEN WEG** (Sauberste, langfristig beste, wartbarste), wobei Respektierung von Design-Intentionen Priorität hat.

3.3. **DD: De-Eskalations-Logik (Optionaler Wechsel zu Enhanced Fix):**
    * **_ACTION_** **Wenn Deep-Dive-Analyse zeigt:**
        * ✅ Tatsächlich einfacher Fix (Planung von 1-2 Dateien).
        * ✅ Klare Wurzelursache schnell gefunden (nach Analyse-Iterationen).
        * ✅ Keine Architektur-Implikationen (bestätigt durch Gemini).
    * **→ Aktion:** Setze `workflow_path` auf "enhanced_fix_workflow" und fahre mit der Implementierungsstrategie (Schritt 2.3) fort, wobei die Mandatory Quality Gates (2.4) und optionalen Reviews (2.5) beibehalten werden.

3.4. **DD: Granulare Schritt-Planung mit Reviews:**
    * **_ACTION_** Basierend auf der Strategie, beginne mit der Erstellung einer **detaillierten, schrittweisen Anleitung**. Jeder Schritt muss eine **spezifische, einzelne, unteilbare Aktion** sein.
    * **_ACTION_** Für jeden X.Y-Schritt: Führe ein **Multi-LLM Validation** durch (Details in 4.1). **_ROUTING_**: Routen der Review an LLMs basierend auf `LLM_ROUTING_RULES`.

---
## 4. Iteratives LLM-Review jedes Schritts (Konsolidierter Prozess)

*(Dieser Abschnitt wird von den Workflows "Enhanced Fix" und "Deep-Dive" genutzt, wenn ein Review nötig ist.)*

### _STEP_ 4.1. Durchführung des Reviews

4.1.1. **Planungs-Review:**
    * **_CONTEXT_**
        ```
        ---
        **🧪 Planungs-Review: Ziel & Kontext**
        Ziel: {{REVIEW_CONTEXTS_AND_CHECKLISTS.planning_review.goal}}
        Fokus: {{REVIEW_CONTEXTS_AND_CHECKLISTS.planning_review.focus}}
        ---
        ```
    * **_REVIEW_** Bewerte den Planungs-Schritt X.Y anhand der `planning_review.checklist` mit den relevanten LLMs (basierend auf `LLM_ROUTING_RULES`).
    * **_CHECKLIST_** Antworte mit:
        ```markdown
        **📋 Planungs-Review Checkliste:**
        - [ ] Unterstützt der Schritt die übergeordnete Architektur? [Ja/Nein/Teilweise - Begründung]
        - [ ] Verursacht er keine unerwünschten Kopplungen? [Ja/Nein - Begründung]
        - [ ] Ist er effizient, wartbar und testbar? [Ja/Nein - Begründung]
        - [ ] Birgt er Sicherheitsrisiken oder potenzielle Regression? [Ja/Nein - Begründung]
        ```

4.1.2. **Umsetzungs-Review (Wenn Modus `umsetzungs-review` oder `hybrid` aktiv):**
    * **_CONTEXT_**
        ```
        ---
        **🧪 Umsetzung-Review: Ziel & Kontext**
        Ziel: {{REVIEW_CONTEXTS_AND_CHECKLISTS.implementation_review.goal}}
        Fokus: {{REVIEW_CONTEXTS_AND_CHECKLISTS.implementation_review.focus}}
        ---
        ```
    * **_REVIEW_** Bewerte die Umsetzung für Schritt X.Y anhand der `implementation_review.checklist` mit den relevanten LLMs (basierend auf `LLM_ROUTING_RULES`).
    * **_CHECKLIST_** Antworte mit:
        ```markdown
        **📋 Umsetzung-Review Checkliste:**
        - [ ] Entspricht die Umsetzung dem ursprünglichen Plan? [Ja/Nein - Begründung]
        - [ ] Ist der Code klar, modular und dokumentiert? [Ja/Nein - Begründung]
        - [ ] Wurden Clean Code / Best Practices eingehalten? [Ja/Nein - Begründung]
        - [ ] Ist die Maßnahme ausreichend getestet? [Ja/Nein - Begründung]
        ```

### _STEP_ 4.2. Post-Review-Aktionen

4.2.1. **Konflikt-Resolution:**
    * **_PROCESS_** Bei widersprüglichem Feedback zwischen LLMs: Identifiziere zugrunde liegende Argumente, bewerte kritisch, triff **begründete Entscheidung für den BESTEN WEG**. Nutze `Konflikt-Resolution Framework` (siehe Anhang unten).
    * **_ACTION_** Synthetisiere das Feedback und passe den Task X.Y bei Bedarf an, bis er als optimierter Plan gilt.

---
## 5. Intelligente Output-Formate & Präsentation

* **_OUTPUT_** Präsentiere den finalisierten Plan basierend auf `workflow_path`:

### **Für `enhanced_fix_workflow` (Einfach):**
```markdown
## 🔧 Bug/Task Fix Summary
**Ansatz:** Enhanced Fix (Automatisch erkannt als einfach)
**Problem/Task:** [Kurze Beschreibung des Problems oder des Tasks]
**Wurzelursache/Ziel:** [Was war falsch / Was soll erreicht werden]
**Lösung/Geplanter Schritt:** [Die minimale Änderung/Aktion]
**Geplante/Betroffene Dateien:** [Liste der geplanten Dateien oder Komponenten]

### Geplante Änderungen (Einzelne Aktionen):
- [ ] [Spezifische Änderung 1]
- [ ] [Spezifische Änderung 2]

### Qualitäts-Gates (Simuliert und bestanden):
- [x] Build ✅ TypeCheck ✅ Linter ✅
- [x] Manuelle Überprüfung des Plans ✅
````

### **Für `multi_llm_deep_dive_workflow` (Komplex):**

```markdown
## 🧠 Multi-LLM Analyse & Task/Fix-Plan
**Ansatz:** Deep-Dive (Automatisch eskaliert wegen: [Kurze Begründung, z.B. "Komplexitäts-Score 5", "Wurzelursache unklar in Quick Analysis"])
**Wurzelursache/Task-Ziele:** [Detaillierte Analyse des Problems / Genaue Ziele des Tasks]
**Architektur-Impact/Konformität:** [Beschreibung der System-Implikationen oder der Integration in die Architektur]
**Identifizierte Systemabhängigkeiten:** [Liste der relevanten abhängigen Komponenten/Systeme]
**Dein Verständnis der Architektur:** [Skizzierung des erfassten Architektur-Kontextes und Quellen.]

### Detaillierter Plan (TODO-Liste):
- [ ] **X.Y [Spezifische, einzelne, unteilbare Aktion]:** [Detaillierte Beschreibung der Aktion.]
    - [ ] **X.Y-Review (Planungs-Feedback):**
        - [ ] Architektur respektiert? [Ja/Nein/Teilweise - Begründung]
        - [ ] Entkoppelt & testbar? [Ja/Nein - Begründung]
        - [ ] Sicherheitsaspekte berücksichtigt? [Ja/Nein - Begründung]
        - [ ] Effizient & wartbar? [Ja/Nein - Begründung]
        [Zusammenfassung der Erkenntnisse aus dem Planungs-Review. **Explizite Erwähnung, wie der Schritt die Architektur und die identifizierten Abhängigkeiten respektiert oder warum eine Abweichung bewusst gewählt wurde.**]
    - [ ] **X.Y-Umsetzungs-Review (Optional, falls durchgeführt):** [Wenn dieser Modus aktiv ist, gib hier ein zusammenfassendes Feedback zur Qualität und Korrektheit der *Implementierung* dieses Schrittes, basierend auf der gemeinsamen Analyse mit Gemini und O3.]

// ... für alle weiteren Schritte nach diesem Muster ...
```

  * **Zusätzliche Empfehlungen:** Füge gegebenenfalls **Empfehlungen für Tests** oder präventive Maßnahmen hinzu.
  * **Umfassende Begründung:** Begründe **nachvollziehbar und detailliert**, warum dieser Plan als der **"BESTE und sauberste"** erachtet wird. Beziehe dich dabei explizit auf die Erkenntnisse aus den **LLM-Reviews, die Einhaltung von Best Practices und die kompromisslose Ausrichtung auf Qualität**. Erläutere zudem, wie **divergierendes Feedback behandelt und zur optimalen Planungs-Lösung geführt hat, insbesondere im Hinblick auf das Respektieren oder bewusste Anpassen der Architektur und der Berücksichtigung von Systemabhängigkeiten.**
  * **Transparenz:** Der Benutzer sieht immer, welcher Ansatz gewählt wurde und warum eine Auto-Eskalation stattfand, muss aber nie selbst die Komplexität bewerten.

-----

### **Anhang: Konflikt-Resolution Framework**

```yaml
# Diese Regeln werden von Claude bei widersprüglichem Feedback genutzt.

- konflikt_type: "Security vs Performance"
  auto_rule: "Security gewinnt"
  example: "Validation kostet Performance -> Validation bleibt"
- konflikt_type: "Maintainability vs Speed"
  auto_rule: "Maintainability gewinnt"
  example: "Refactor dauert länger -> Refactor machen"
- konflikt_type: "Existing Pattern vs New Pattern"
  auto_rule: "Existing gewinnt"
  example: "Neue vs bestehende Architektur -> Bestehende nutzen"
- konflikt_type: "Minimal vs Comprehensive"
  auto_rule: "Minimal gewinnt (im Enhanced Fix)"
  example: "3 Zeilen vs 30 Zeilen -> 3 Zeilen"
```

-----

**Benutzeranfrage (Beschreibung des Tasks):** [Fügen Sie hier die ursprüngliche Beschreibung des Tasks durch den Benutzer ein]

```
```
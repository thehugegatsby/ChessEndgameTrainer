---
# Debug Session Template
# Kopiere diese Vorlage für neue Debug-Sessions

id: bug-YYYY-MM-DD-XXX
title: "[Kurze Beschreibung des Problems]"
severity: low|medium|high|critical
time_to_fix: [Minuten]
pattern_id: [z.B. js.MethodBinding.ArrowPropertyThis]

# 1. SYMPTOME & KONTEXT
symptom: "[Was war das beobachtete Problem?]"
error_signature: "[Exakte Fehlermeldung]"
environment:
  - test_runner: 
  - dom_env: 
  - framework: 
  - language: 

# 2. IRRWEGE (KRITISCH für LLM-Learning!)
# Dokumentiere ALLE falschen Hypothesen
failed_hypotheses:
  - hypothesis: "[Was wurde zuerst vermutet?]"
    time_wasted: [Minuten]
    indicators: ["Welche Hinweise führten zu dieser Hypothese?"]
    why_wrong: "[Warum war das falsch?]"
    
  - hypothesis: "[Zweite falsche Vermutung]"
    time_wasted: [Minuten]
    indicators: []
    why_wrong: ""

# 3. LÖSUNG
root_cause: "[Die tatsächliche Ursache]"
solution: |
  ```[language]
  # Code der das Problem löst
  ```

# 4. ERKENNUNGSMUSTER für Zukunft
key_indicators:
  - "[Hinweis 1 der auf dieses Problem deutet]"
  - "[Hinweis 2]"
  - "[Hinweis 3]"

# 5. PLAYBOOK für ähnliche Fälle
next_time_try:
  1. "[Erster Schritt beim nächsten Mal]"
  2. "[Zweiter Schritt]"
  3. "[Dritter Schritt]"

# 6. ANTI-PATTERNS (Was NICHT tun)
avoid:
  - "[Nicht wieder X Stunden mit Y verschwenden]"
  - "[Diese Hypothese ist meist falsch wenn...]"

# 7. RELATED PATTERNS
related_bugs:
  - "[Link zu ähnlichem Bug]"
  - "[Pattern ID eines verwandten Problems]"

# 8. CODE SMELLS
code_smells:
  - class_property_arrow_method
  - mock_as_arrow_function
  - missing_this_binding
  - vi_fn_as_property

# 9. METRIKEN
metrics:
  files_checked: [Anzahl]
  false_starts: [Anzahl falscher Hypothesen]
  commits_to_fix: [Anzahl]
  developers_involved: [Anzahl]
---

## Detaillierte Analyse

[Hier kannst du eine ausführliche Beschreibung des Debug-Prozesses schreiben,
die für Menschen lesbar ist. Das YAML oben ist für LLMs optimiert.]

### Timeline

1. **00:00** - Problem entdeckt: ...
2. **00:30** - Erste Hypothese: ...
3. **02:00** - Pivotiert zu neuer Hypothese: ...
4. **04:00** - Root Cause gefunden: ...

### Lessons Learned

- 
- 
- 

### Prävention

Um dieses Problem in Zukunft zu vermeiden:
1. 
2. 
3.
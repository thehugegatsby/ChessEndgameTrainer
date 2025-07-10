# /fix Command

Du hast Zugriff auf mehrere andere große Sprachmodelle (LLMs) über Zen MCP, insbesondere **Gemini 2.5 Pro** und **O3/O3 mini**. Deine Hauptaufgabe ist es, einen vorliegenden Bug zu verstehen, eine detaillierte Analyse durchzuführen und die **BESTE, SAUBERSTE und ROBUSTESTE LÖSUNG** dafür zu planen. **Wichtig: Es geht hier AUSSCHLIESSLICH um die Planungsphase, nicht um die Ausführung oder Code-Generierung durch dich selbst. Du erstellst einen Plan für andere AIs zur Umsetzung.**

Da AIs den Code generieren und schnell sind, spielen der direkte manuelle Aufwand und die benötigte Zeit für die Umsetzung der vorgeschlagenen Lösung eine untergeordnete Rolle. Der Fokus liegt kompromisslos auf der **langfristigen Wartbarkeit, Skalierbarkeit, Sicherheit und der höchsten Code-Qualität ("Clean Code")**.

Hier ist der detaillierte Prozess, dem du folgen sollst:

---
## Bug-Analyse und Datensammlung

1.  **Bug-Verständnis:**
    * Lies die Beschreibung des Bugs sorgfältig durch.
    * Formuliere Hypothesen über die mögliche Ursache oder Art des Fehlers.
    * Überlege, welche Informationen noch fehlen könnten, um den Bug vollständig zu erfassen.

2.  **Datensammlung (Anfrage an den Benutzer/Simulation):**
    * Identifiziere, welche **Daten, Informationen und Logs** relevant sind, um den Bug zu diagnostizieren (z.B. Fehlermeldungen, Stack Traces, relevante Konfigurationsdateien, Schritte zur Reproduktion, betroffene Umgebungen, Zeitpunkt des Auftretens, Änderungen vor dem Auftreten).
    * Falls der Benutzer diese Informationen nicht direkt bereitstellt, **simuliere umgehend das Vorhandensein typischer relevanter Daten für den beschriebenen Bug und nutze diese simulierten Daten für deine weitere Analyse.**
    * Sammle und strukturiere diese Informationen (ob real oder simuliert) sorgfältig.

3.  **Erste Interne Analyse:**
    * Analysiere die gesammelten (oder simulierten) Daten und Logs selbstständig und eigenverantwortlich.
    * Versuche, Muster, Anomalien oder spezifische Fehlermeldungen zu identifizieren, die auf die Ursache des Bugs hindeuten.
    * Erstelle eine erste interne Hypothese über die Wurzelursache des Bugs und mögliche grobe Lösungsansätze.

---
## Kollaborative Lösungsfindung & Granulare Schrittfolge

4.  **Generierung der Groben Lösungsstrategie & Erster LLM-Konsultation:**
    * Präsentiere den anderen LLMs (insbesondere **Gemini 2.5 Pro als strategischem Architekten**) eine prägnante Zusammenfassung des Bugs, der gesammelten (oder simulierten) Daten und deiner ersten Analyse/Hypothese.
    * Frage sie nach ihrer Einschätzung der **Wurzelursache** und nach **möglichen groben Lösungsstrategien**.
    * Bitte sie um Vorschläge für die **BESTE, SAUBERSTE und effizienteste Herangehensweise** zur Behebung, die auch Aspekte wie **Architektur, Skalierbarkeit, Performance, langfristige Wartbarkeit, Sicherheit und die Einhaltung von Best Practices** kompromisslos berücksichtigt. **Erinnere dich: Aufwand und Zeit für die Umsetzung sind durch AI-Generierung weniger kritisch; die Qualität des Plans ist entscheidend.**
    * Bei widersprüchlichen Vorschlägen: Identifiziere die zugrunde liegenden Argumente, bewerte diese kritisch und triff eine **begründete Entscheidung für den BESTEN Weg** im Sinne der langfristigen Qualität.

5.  **Entwicklung der Granularen Schrittfolge mit iterativem LLM-Review (Interner Prozess):**
    * Basierend auf der besten identifizierten Lösungsstrategie, beginne mit der Erstellung einer **detaillierten, schrittweisen Anleitung** zur Behebung des Bugs. **Jeder einzelne Schritt muss sofort im Anschluss mit den anderen LLMs überprüft werden.**

    * **Muster für jeden Schritt (Interner Prozess):**
        * **X.1 [Spezifische Aufgabe]:** Beschreibe den genauen Task, der ausgeführt werden muss, um einen Teil der Lösung zu planen. Sei so präzise wie möglich, damit er von einer AI umgesetzt werden kann (z.B. "Code-Anpassung in Datei `X.js`: Logik für Y in Funktion `Z()` umstellen auf `neue_methode()` gemäß Muster M.").
        * **X.1-Review:** Präsentiere den gerade formulierten Task den anderen LLMs (über Zen MCP) zur Überprüfung. **Nutze dabei gezielt die Stärken:**
            * **Gemini 2.5 Pro (Strategischer Architekt):** Frage nach architektonischen Implikationen, langfristiger Sauberkeit, potenziellen systemischen Risiken und ob der Schritt die Wurzelursache adäquat adressiert. **Betone, dass die "beste" Lösung auch eine vollständige Überarbeitung eines Moduls bedeuten kann, wenn dies der sauberste Weg ist.**
            * **O3 / O3 mini (Präzisionshandwerker):** Frage nach technischer Korrektheit, Effizienz, potenziellen Sicherheitsimplikationen, Code-Optimierung, Wartbarkeit, Testbarkeit und der Einhaltung von **strengen Best Practices für sauberen Code**.
        * **Stelle zusätzliche, allgemeine Fragen zu diesem Schritt:**
            * "Gibt es potenzielle Nebenwirkungen oder Risiken bei der Ausführung dieses Plans?"
            * "Kann dieser Schritt noch effizienter oder sauberer geplant werden?"
            * "Gibt es Abhängigkeiten oder Vorbedingungen, die hier berücksichtigt werden müssen?"
            * "Fehlt hier etwas Wichtiges für eine AI-gesteuerte Implementierung?"
        * **Bei widersprüchlichem Feedback (z.B. zwischen Gemini 2.5 Pro und O3/O3 mini):** Identifiziere die zugrunde liegenden Argumente, bewerte diese kritisch und triff eine **begründete Entscheidung für den BESTEN Weg** (Sauberste, langfristig beste, wartbarste).
        * **Synthetisiere das Feedback** und passe den Task X.1 bei Bedarf an, bis er als optimierter Plan gilt.
        * *(Fahre dann fort mit X.2 [Nächste spezifische Aufgabe] und X.2-Review und so weiter, bis die gesamte Lösung in einzelnen, überprüften Planungs-Schritten abgebildet ist.)*
    * Das detaillierte Protokoll der einzelnen Review-Iterationen führst du intern.

---
## Finales Ergebnis

6.  **Präsentation des Optimalen Bugfixing-Plans (als detaillierte TODO-Liste):**
    * Stelle den **finalisierten, optimierten Plan zur Behebung des Bugs** dar.
    * Erläutere klar die **Ursache des Bugs** (sofern identifiziert).
    * Präsentiere die **vollständige, granulare Schrittfolge zur Behebung**, die durch die iterativen LLM-Reviews verifiziert wurde. Jeder Schritt sollte nummeriert und klar beschrieben sein und als **direkte Anleitung für eine AI zur Code-Generierung/Implementierung** dienen.
    * **Die Präsentation der Schritte muss dem folgenden Format entsprechen, um den Review-Prozess transparent zu machen:**

        ```
        **1.1 [Spezifische Aufgabe 1]:** [Detaillierte Beschreibung des Tasks, z.B. "Anpassung der Authentifizierungslogik in `AuthService.java`: Methode `validateToken()` um JWT-Signaturprüfung erweitern."]
        **1.1-Review:** [Zusammenfassung der wichtigsten Erkenntnisse und Optimierungen aus dem Review mit Gemini 2.5 Pro und O3/O3 mini für diesen spezifischen Schritt. Erläutere, warum dieser Schritt in dieser Form als optimal erachtet wird.]

        **1.2 [Spezifische Aufgabe 2]:** [Detaillierte Beschreibung des nächsten Tasks, z.B. "Erstellung eines neuen Datenbank-Schemas für Benutzerrollen: Tabelle `user_roles` mit Spalten `user_id` und `role_id` anlegen."]
        **1.2-Review:** [Zusammenfassung der wichtigsten Erkenntnisse und Optimierungen aus dem Review mit Gemini 2.5 Pro und O3/O3 mini für diesen spezifischen Schritt.]

        // ... und so weiter für alle weiteren Schritte ...
        ```
    * Füge gegebenenfalls **Empfehlungen für Tests** oder präventive Maßnahmen hinzu, um ein erneutes Auftreten zu verhindern.
    * Begründe **nachvollziehbar und detailliert**, warum dieser Plan als der **"BESTE und sauberste"** erachtet wird. Beziehe dich dabei explizit auf die Erkenntnisse aus den **LLM-Reviews, die Einhaltung von Best Practices (wie langfristige Wartbarkeit, Skalierbarkeit, Sicherheit) und die kompromisslose Ausrichtung auf Qualität**. Erläutere zudem, wie **divergierendes Feedback behandelt und zur optimalen Planungs-Lösung geführt hat.**

---

**Benutzeranfrage (Beschreibung des Bugs):** {{BUG_DESCRIPTION}}
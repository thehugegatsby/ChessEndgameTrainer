# Chess Endgame Trainer - Requirements

## Überblick

Die Entwicklung des "Chess Endgame Trainers" zielt darauf ab, Schachspielern aller Stärken ein interaktives Tool zur Verbesserung ihrer Endspielkenntnisse und -technik zu bieten. Das System soll Endspielpositionen zur Lösung anbieten, präzises Feedback geben, den Fortschritt verfolgen und eine effiziente Lernumgebung schaffen.

## 1. Benutzererlebnis & Navigation

### 1.1 Start und Hauptmenü
- Beim Start der Anwendung soll ein **Hauptmenü** angezeigt werden
- Das Hauptmenü soll **Endspielkategorien** anzeigen:
  - Bauernendspiele
  - Turmendspiele
  - Damenendspiele
- Diese Kategorien sollen durch **klare Symbole/Icons** visualisiert werden (z.B. ein kleines Diagramm für "König + Bauer gegen König")
- Die Auswahl einer Kategorie führt zu einem **Untermenü**, das spezifische Endspieltypen innerhalb dieser Kategorie auflistet

### 1.2 Positionsauswahl & -darstellung
- Nach Auswahl eines Endspieltyps sollen die **verfügbaren Positionen** angezeigt werden (als Liste)
- Jede Position soll mit einem **klaren Startobjektiv** präsentiert werden
- Das **primäre Objektiv** (z.B. "Weiß am Zug und gewinnt", "Schwarz am Zug und hält Remis") soll immer **präsent und an derselben Stelle** auf dem Bildschirm sichtbar sein
- **Zusätzliche, spezifische Zwischenziele** (z.B. "Vertreibe den gegnerischen König von der E-Linie") sollen **textlich unterhalb des Hauptobjektivs** eingeblendet werden

### 1.3 Zugausführung & Regelvalidierung
- Benutzer sollen Züge durch Klicken auf Figuren und Zielfelder ausführen können
- Das System soll die **Gültigkeit jedes Zuges nach Schachregeln** validieren
- **Ungültige Züge** sollen **nicht ausgeführt** werden; es ist **kein explizites visuelles oder textuelles Feedback** dafür erforderlich
- Das System soll die **aktuelle Brettposition** nach jedem gültigen Zug aktualisieren
- **Keine visuelle Hervorhebung gültiger Züge** ist erforderlich

## 2. Tablebase-Integration & Feedback

### 2.1 Tablebase-basierte Zugvalidierung
- Nach jedem Spielzug des Benutzers soll das System die resultierende Position **sofort mit einer Endspiel-Tablebase überprüfen**
- Ein Zug ist dann **korrekt**, wenn die Stellung nach dem Zug gemäß Tablebase ihren **ursprünglichen Gewinn-Status** (bei Gewinn-Aufgaben) oder **Remis-Status** (bei Remis-Aufgaben) beibehält

### 2.2 Positives Feedback bei korrekten Zügen
- Wenn ein Spieler einen korrekten Zug macht, der den gewünschten Status der Stellung beibehält, soll ein **grüner Haken hinter dem Zug in der Zugliste** erscheinen

### 2.3 Negatives Feedback bei Gewinn-/Remis-Verlust (Blunder)
- Wenn ein Zug den **Tablebase-Status negativ verändert**, soll **sofort ein Pop-up** erscheinen
- Das Pop-up soll die Meldung **"Das war ein Fehler, versuch's nochmal"** anzeigen
- Dieses Pop-up soll **keine detaillierte Erklärung des Fehlers** oder den korrekten Zug direkt anzeigen
- Das Pop-up soll die **Option zum Neustart der Position** oder zum **erneuten Versuch des Zuges** anbieten
- Eine **Möglichkeit, die Tablebase-Lösung später einzusehen**, soll vorhanden sein

### 2.4 Gegnerische Züge (Schwarz)
- Nach einem korrekten Zug des Spielers soll der Computer (Schwarz) seinen **tablebase-perfekten Verteidigungszug sofort und automatisch** ausführen
- Der Computer soll immer den Zug wählen, der die bestmögliche Verteidigung darstellt

### 2.5 Ende der Position
- Wenn eine Position ein **Tablebase-Fazit** erreicht (z.B. Matt, Remis), soll das System das Ergebnis klar anzeigen
- Idealerweise mit der Zuganzahl bis zum Abschluss (z.B. "Weiß gewinnt in 5 Zügen")

## 3. Automatische Auflösung trivialer Positionen

### 3.1 Definition trivialer Positionen
- **Bauernumwandlung in eine Dame** wird als eine typisch **triviale Position** betrachtet
- Das System soll zukünftig weitere Kriterien für Trivialität definieren (z.B. Matt in X Zügen)

### 3.2 Angebot und Ausführung der automatischen Auflösung
- Wenn eine Position trivial wird, soll das System die **automatische Auflösung anbieten**
- Bei Wahl der automatischen Auflösung soll das System die **Position ohne weitere Benutzereingaben abschließen**
- Ein **Pop-up mit "Geschafft!"** soll den erfolgreichen Abschluss anzeigen

### 3.3 Demonstration der Technik
- Wenn eine automatische Auflösung erfolgt, soll das System die **Gewinntechnik demonstrieren**
- Die **Züge, die zum Ziel führen**, sollen schnell abgespielt werden

### 3.4 Fortschrittsverfolgung & Statistik
- Automatisch gelöste Positionen sollen **nicht als Fehler zählen**
- Sie sollen **nicht in der Fortschrittsstatistik** des Spielers auftauchen

## 4. Fortschrittsverfolgung

### 4.1 Ergebnisaufzeichnung
Für jede Position soll das System das Ergebnis aufzeichnen:
- **"solved correctly"** - korrekt gelöst
- **"solved with hints"** - gelöst mit Hinweisen (nach "Neu versuchen"-Option)
- **"failed"** - fehlgeschlagen

### 4.2 Bestes Ergebnis
- Bei mehreren Versuchen einer Position soll nur das **beste Ergebnis** aufgezeichnet werden
- Priorität: "solved correctly" > "solved with hints" > "failed"

### 4.3 Progress Dashboard
- Ein Dashboard soll dem Benutzer seine Fortschritte anzeigen
- Es soll Statistiken für jeden Endspieltyp und allgemeine Verbesserungstrends zeigen
- Zukünftig soll es die Integration von Spaced Repetition umfassen

## 5. Spielzustand & Flexibilität

### 5.1 Positionsgeschichte & Undo
- Das System soll die Historie der ausgeführten Züge korrekt verwalten
- Eine **"Undo"-Funktion** soll es dem Benutzer ermöglichen, zum vorherigen Zug zurückzukehren

### 5.2 Regelkonformität
- Das System muss alle relevanten Schachregeln korrekt anwenden
- Inklusive spezieller Züge wie **En Passant**
- Korrekte Erkennung und Anzeige von **Schachmatt und Patt**

## 6. Lernen durch Demonstration & Schrittweise Module

### 6.1 Demonstrationsmodus
- Für neue oder komplexe Endspieltypen soll ein **Demonstrationsmodus** angeboten werden
- Im Demo-Modus soll der Benutzer **Züge in seinem eigenen Tempo durchklicken** können
- Das System soll während der Demonstration **Erklärungen oder visuelle Hinweise** (textbasiert) liefern
- Der Benutzer soll **eigene experimentelle Züge** im Demo-Modus eingeben können
- Nach Abschluss der Demonstration soll ein **nahtloser Übergang zum Trainingsmodus** angeboten werden
- Demonstrationen sollen die Trainingsstatistiken nicht beeinflussen

### 6.2 Schritt-für-Schritt-Lernmodule (für komplexe Endspiele)
- Komplexe Endspiele (z.B. Lucena-Brückenbau) sollen in **mehrere, feste Teilschritte** unterteilt sein
- Jeder Schritt hat ein **spezifisches Zwischenziel** (z.B. "Vertreibe den König von der E-Linie")
- Das System soll **automatisch zum nächsten Schritt** übergehen, sobald das aktuelle Zwischenziel erreicht ist
- Der Benutzer soll auch die **Option haben, manuell zwischen den Schritten zu wechseln**
- Nachdem alle Teilschritte gemeistert wurden, soll das **komplette Endspiel** als finale Herausforderung angeboten werden

## 7. Spaced Repetition Learning

### 7.1 Algorithmus
- Das System soll einen **Spaced Repetition Algorithmus** (z.B. SM-2 oder Anki-ähnlich) verwenden
- Positionen, die korrekt gelöst wurden, werden mit zunehmenden Intervallen zur Wiederholung eingeplant
- Positionen, bei denen Fehler gemacht wurden, werden häufiger zur Wiederholung eingeplant
- Das System soll die **am meisten "vergessenen" Positionen priorisieren**

### 7.2 Dashboard-Integration
- Das Spaced Repetition Dashboard soll anzeigen:
  - **Anzahl der heute fälligen Wiederholungen**
  - **Anzahl der bereits heute wiederholten Positionen**
  - **Allgemeine Erinnerungsquote** (Prozentsatz der korrekt erinnerten Positionen)
  - **Besonders schwierige Positionen** (die häufiger vergessen werden)
- Beim Start der App soll das System automatisch die für die Spaced Repetition fälligen Positionen präsentieren

## Technische Anforderungen

### Frontend
- Modern web application (bereits implementiert mit Next.js/React)
- Responsive Design für verschiedene Bildschirmgrößen
- Touch-freundliche Bedienung

### Backend & Datenquellen
- Integration mit Lichess Tablebase API für Endspiel-Bewertungen
- Lokale Stockfish-Engine für Stellungsanalyse
- Persistente Speicherung von Benutzerfortschritt

### Performance
- Schnelle Antwortzeiten für Zugvalidierung (< 100ms)
- Effizientes Caching von Tablebase-Abfragen
- Minimale Ladezeiten beim Wechsel zwischen Positionen
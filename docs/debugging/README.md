# 🐛 Debugging Knowledge Base

## Zweck

Diese Dokumentation sammelt **komplexe Debugging-Sessions** um:
- 🎯 Wiederkehrende Probleme schneller zu erkennen
- 🚀 Erfolgreiche Lösungsstrategien zu teilen
- ⚠️ Irrwege und Zeitfresser zu vermeiden
- 🤖 LLMs mit Kontext für bessere Hilfe zu versorgen

## Struktur

Jede Debug-Session wird nach dem **TEMPLATE.md** Format dokumentiert mit:

### Pflichtfelder (YAML Header)
- **symptom**: Was war das Problem?
- **failed_hypotheses**: Welche falschen Wege wurden verfolgt?
- **root_cause**: Was war die echte Ursache?
- **solution**: Wie wurde es gelöst?
- **key_indicators**: Woran erkennt man dieses Problem?

### Wichtig: Irrwege dokumentieren!

Der wichtigste Teil sind die **failed_hypotheses** - diese helfen LLMs und Menschen, nicht wieder in dieselben Fallen zu tappen.

## Verwendung mit LLMs

### Bei einem neuen Bug:
```
"Ich habe einen Bug mit [SYMPTOM]. 
Schau in docs/debugging/ nach ähnlichen Patterns.
Besonders: Welche failed_hypotheses gab es bei ähnlichen Problemen?"
```

### Pattern-Suche:
```
"Suche in docs/debugging/ nach pattern_id: js.MethodBinding.ArrowPropertyThis"
```

### Anti-Pattern Check:
```
"Ich vermute [HYPOTHESIS]. 
Check docs/debugging/ ob das schon mal ein Irrweg war."
```

## Bekannte Patterns

| Pattern ID | Beschreibung | Häufigkeit |
|------------|--------------|------------|
| `js.MethodBinding.ArrowPropertyThis` | Arrow Function als Property statt Methode | ⭐⭐⭐ |
| `testing.MockImplementation.IncorrectBinding` | Mock-Struktur entspricht nicht Original | ⭐⭐⭐ |
| `env.Mismatch.DOM` | Happy-DOM vs JSDOM Unterschiede | ⭐⭐ |
| `vitest.MockFunction.AsProperty` | vi.fn() falsch verwendet | ⭐⭐ |

## Best Practices

1. **Sofort dokumentieren** - Nicht warten bis Details vergessen sind
2. **Ehrlich über Irrwege** - Diese sind der wertvollste Teil
3. **Zeit tracken** - Wie lange hat jede Hypothese gekostet?
4. **Code-Beispiele** - Zeige FALSCH vs RICHTIG
5. **Playbook erstellen** - Was würdest du beim nächsten Mal zuerst tun?

## Integration in Workflow

### Nach jedem komplexen Bug:
1. Kopiere `TEMPLATE.md`
2. Fülle alle Felder aus (besonders failed_hypotheses!)
3. Commit als `YYYY-MM-DD-kurze-beschreibung.md`
4. Update README.md wenn neues Pattern entdeckt

### Bei Code Review:
- Prüfe ob ähnliche Bugs schon dokumentiert sind
- Verweise auf relevante Debug-Docs

### Für LLM-Assistenten:
- Lade relevante Docs als Kontext
- Nutze pattern_id für schnelle Suche
- Checke Anti-Patterns bevor lange Debug-Session

## Statistiken

- 📊 Dokumentierte Sessions: 1
- ⏱️ Durchschnittliche Debug-Zeit: 4h
- 💡 Häufigster Irrweg: Observer/DOM Mocking Issues
- ✅ Erfolgsquote mit Playbook: TBD

## Nächste Schritte

- [ ] Automatisches Pattern Mining Script
- [ ] Integration in CI/CD Warnings
- [ ] LLM-Training auf unseren Patterns
- [ ] Dashboard für Pattern-Statistiken
# Legacy Scripts (Archived)

Diese Scripts wurden aus der package.json entfernt um die Komplexität zu reduzieren.
Sie sind hier dokumentiert falls sie noch benötigt werden.

## Entfernte Duplicates (12.08.2025)

- `test:coverage:evaluation` - identisch mit `test:coverage`
- `test:ci` - identisch mit `test:all`
- `tsc` - verwende stattdessen `type-check`
- `emulator` - identisch mit `firebase:emulator`

## Legacy Development Scripts

### dev:legacy

```bash
node -e "const {PORTS} = require('./config/ports'); require('child_process').execSync('next dev -p ' + PORTS.DEV, {stdio: 'inherit'})"
```

Läuft ohne Turbopack. Nutze stattdessen `dev` mit Turbopack.

## Legacy Test Scripts

### test:legacy

```bash
cross-env NODE_OPTIONS='--import tsx/esm' jest --config=config/testing/jest.config.ts --no-coverage
```

Jest ohne Coverage. Nutze stattdessen `test:jest` mit `--no-coverage` Flag.

### test:fast

```bash
cross-env NODE_OPTIONS='--max-old-space-size=2048 --import tsx/esm' jest --config=config/testing/jest.config.ts --no-coverage --bail --silent
```

Schneller Test-Modus mit bail und silent flags.

### test:smoke

```bash
jest --config=src/tests/jest.config.js --testPathPattern=smoke
```

Smoke tests mit alter Konfiguration.

## PM2 Scripts (für Production)

```bash
"dev:pm2": "pm2 start ecosystem.config.js",
"dev:pm2:stop": "pm2 stop endgame-trainer-dev",
"dev:pm2:restart": "pm2 restart endgame-trainer-dev",
"dev:pm2:logs": "pm2 logs endgame-trainer-dev"
```

## Mobile Scripts (React Native)

```bash
"mobile:start": "cd app/mobile && expo start",
"mobile:android": "cd app/mobile && expo start --android",
"mobile:ios": "cd app/mobile && expo start --ios",
"mobile:web": "cd app/mobile && expo start --web"
```

Nur relevant wenn mobile App entwickelt wird.

## Utility Scripts

```bash
"fix:position-ids": "pnpm exec tsx scripts/renamePositionIds.ts",
"seed:test-positions": "pnpm exec tsx scripts/seedTestPositions.ts",
"validate:agent-config": "node scripts/validate-agent-config.js"
```

Spezielle einmalige Scripts für Daten-Migration.

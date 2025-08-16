# Logger Service Documentation

## Overview

The Logger service provides structured, multi-level logging with different transports for the ChessEndgameTrainer application. It supports console, file, and remote logging with configurable log levels, filtering, and formatting.

## Architecture

```
Logger/
├── Logger.ts           # Core logger implementation
├── types.ts           # TypeScript interfaces
├── index.ts          # Public API exports
└── __tests__/        # Unit tests
```

## Key Features

- **Multiple log levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Contextual logging**: Add context metadata to log entries
- **Configurable transports**: Console, file, and remote endpoints
- **Circular buffer**: Maintains log history in memory
- **Error tracking**: Automatic stack trace capture
- **Performance monitoring**: Built-in timing utilities
- **Filtered logging**: Filter by context or level

## Core Components

### Logger Class

The main logger implementation providing the logging API.

#### Configuration

```typescript
interface LoggerConfig {
  minLevel: LogLevel; // Minimum level to log
  enableConsole: boolean; // Console output
  enableRemote: boolean; // Remote logging
  remoteEndpoint?: string; // Remote endpoint URL
  maxLogSize: number; // Max logs in memory
  contextWhitelist?: string[]; // Allowed contexts
  contextBlacklist?: string[]; // Blocked contexts
  transports?: ILogTransport[]; // Custom transports
}
```

### Transports

#### ConsoleTransport

- Outputs to browser/Node.js console
- Maps log levels to console methods (debug, info, warn, error)
- Supports structured data output

#### RemoteTransport

- Batches logs for remote transmission
- Automatic retry on failure
- Preserves chronological order
- Default batch size: 50 entries

### Log Formatters

#### DefaultLogFormatter

Formats log entries as:

```
[timestamp] [level] [context] message {data} Error: {error}
```

## Usage Examples

### Basic Logging

```typescript
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger();
logger.info('Application started');
logger.error('Database connection failed', error);
logger.debug('Processing user request', { userId: 123 });
```

### Contextual Logging

```typescript
const authLogger = logger.setContext('AuthService');
authLogger.info('User authenticated', { userId: 456 });
// Output: [timestamp] INFO [AuthService] User authenticated {userId: 456}
```

### Performance Monitoring

```typescript
logger.time('apiCall');
const result = await fetchDataFromAPI();
logger.timeEnd('apiCall');
// Logs: "apiCall: 234.56ms"
```

### With Persistent Fields

```typescript
const requestLogger = logger.withFields({
  requestId: 'abc-123',
  sessionId: 'xyz-789',
});
requestLogger.info('Processing request');
// All logs include requestId and sessionId
```

### Filtered Logging

```typescript
const logs = logger.getLogs({
  minLevel: LogLevel.ERROR,
  context: 'Database',
  startTime: new Date(Date.now() - 3600000),
  searchText: 'connection',
});
```

## Log Levels

| Level | Value | Description                    | Production |
| ----- | ----- | ------------------------------ | ---------- |
| DEBUG | 0     | Detailed debugging information | No         |
| INFO  | 1     | General informational messages | Yes        |
| WARN  | 2     | Warning conditions             | Yes        |
| ERROR | 3     | Error conditions               | Yes        |
| FATAL | 4     | Critical failures              | Yes        |

## Configuration

### Development

```typescript
const devLogger = createLogger({
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
  maxLogSize: 1000,
});
```

### Production

```typescript
const prodLogger = createLogger({
  minLevel: LogLevel.INFO,
  enableConsole: false,
  enableRemote: true,
  remoteEndpoint: 'https://logs.myapp.com/ingest',
  maxLogSize: 5000,
});
```

## API Reference

### Main Methods

| Method                          | Description          | Parameters                                 |
| ------------------------------- | -------------------- | ------------------------------------------ |
| `debug(message, data?)`         | Log debug message    | message: string, data?: any                |
| `info(message, data?)`          | Log info message     | message: string, data?: any                |
| `warn(message, data?)`          | Log warning          | message: string, data?: any                |
| `error(message, error?, data?)` | Log error with stack | message: string, error?: Error, data?: any |
| `fatal(message, error?, data?)` | Log fatal error      | message: string, error?: Error, data?: any |

### Context & Fields

| Method                | Description                | Returns |
| --------------------- | -------------------------- | ------- |
| `setContext(context)` | Create logger with context | ILogger |
| `clearContext()`      | Remove context             | void    |
| `withFields(fields)`  | Add persistent fields      | ILogger |

### Configuration

| Method                 | Description          | Returns      |
| ---------------------- | -------------------- | ------------ |
| `getConfig()`          | Get current config   | LoggerConfig |
| `updateConfig(config)` | Update configuration | void         |

### Utilities

| Method             | Description          | Returns       |
| ------------------ | -------------------- | ------------- |
| `time(label)`      | Start timer          | void          |
| `timeEnd(label)`   | End timer and log    | void          |
| `getLogs(filter?)` | Get stored logs      | LogEntry[]    |
| `clearLogs()`      | Clear log buffer     | void          |
| `flush()`          | Flush all transports | Promise<void> |

## Best Practices

1. **Use appropriate log levels**
   - DEBUG: Development only
   - INFO: Important events
   - WARN: Potential issues
   - ERROR: Recoverable errors
   - FATAL: Unrecoverable errors

2. **Add context for modules**

   ```typescript
   const logger = getLogger().setContext('ModuleName');
   ```

3. **Include structured data**

   ```typescript
   logger.info('User action', { userId, action, timestamp });
   ```

4. **Flush before shutdown**

   ```typescript
   process.on('SIGTERM', async () => {
     await logger.flush();
     process.exit(0);
   });
   ```

5. **Use timers for performance**
   ```typescript
   logger.time('operation');
   await performOperation();
   logger.timeEnd('operation');
   ```

## Testing

The logger can be mocked for testing:

```typescript
const mockLogger = createLogger({
  minLevel: LogLevel.DEBUG,
  enableConsole: false,
  transports: [new MockTransport()],
});
```

## Performance Considerations

- Logs are buffered in memory (default: 1000 entries)
- Remote transport batches requests (default: 50 entries)
- Console transport has minimal overhead
- Use appropriate log levels in production

## Platform Support

The logger automatically detects and includes platform information:

- Web browsers
- Node.js
- Mobile (iOS/Android via React Native)

## Error Handling

- Transport failures don't crash the application
- Remote transport retries failed batches
- Console fallback for critical errors
- Circular reference handling in JSON serialization

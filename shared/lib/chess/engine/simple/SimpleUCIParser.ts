interface UciInfo {
  multipv?: number;   // Multi-PV line number
  depth?: number;
  seldepth?: number;
  score?: { type: 'cp' | 'mate'; value: number };
  pv?: string;
  nodes?: number;
  nps?: number;
  time?: number;
}

/**
 * Simple, robust parser for UCI 'info' strings.
 * Replaces the 352-line complex parser with basic token parsing.
 */
export function parseUciInfo(line: string): UciInfo | null {
  if (!line.startsWith('info')) {
    return null;
  }

  const tokens = line.split(' ');
  const info: UciInfo = {};

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    switch (token) {
      case 'depth':
        info.depth = parseInt(nextToken, 10);
        i++; // Consume next token
        break;
      case 'seldepth':
        info.seldepth = parseInt(nextToken, 10);
        i++;
        break;
      case 'multipv':
        info.multipv = parseInt(nextToken, 10);
        i++;
        break;
      case 'score':
        const scoreType = nextToken as 'cp' | 'mate';
        const scoreValue = parseInt(tokens[i + 2], 10);
        info.score = { type: scoreType, value: scoreValue };
        i += 2;
        break;
      case 'nodes':
        info.nodes = parseInt(nextToken, 10);
        i++;
        break;
      case 'nps':
        info.nps = parseInt(nextToken, 10);
        i++;
        break;
      case 'time':
        info.time = parseInt(nextToken, 10);
        i++;
        break;
      case 'pv':
        // Principal variation is the rest of the line
        info.pv = tokens.slice(i + 1).join(' ');
        return info; // PV is always last
    }
  }

  return Object.keys(info).length > 0 ? info : null;
}

// Additional parsers for other UCI commands
export function parseBestMove(line: string): string | null {
  if (!line.startsWith('bestmove')) return null;
  return line.split(' ')[1] || null;
}

export function parseOption(line: string): { name: string; value: string } | null {
  if (!line.startsWith('option')) return null;
  const match = line.match(/option name (.+) type (.+) default (.+)/);
  if (!match) return null;
  return { name: match[1], value: match[3] };
}
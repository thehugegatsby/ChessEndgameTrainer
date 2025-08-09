# Chess Audio Files

This directory contains audio files for chess game events. These sounds enhance the user experience to match Lichess.org's audio feedback.

## Required Audio Files

The following MP3 files are needed for the chess audio system:

- `move.mp3` - Regular piece move sound
- `capture.mp3` - Piece capture sound
- `check.mp3` - Check notification sound
- `checkmate.mp3` - Checkmate/win sound
- `draw.mp3` - Draw/stalemate sound
- `promotion.mp3` - Pawn promotion sound
- `error.mp3` - Invalid move or error sound
- `success.mp3` - Training success sound

## Audio Requirements

- Format: MP3 (web compatible)
- Duration: 200-500ms (short, crisp sounds)
- Quality: 44.1kHz, 128kbps minimum
- Volume: Normalized to consistent levels

## Sources

You can source these sounds from:

1. **Lichess.org** - Extract from browser developer tools
2. **Chess.com** - Similar chess platform sounds
3. **Freesound.org** - Creative commons chess/game sounds
4. **Custom synthesis** - Create using audio software

## Installation

Place the MP3 files directly in this directory. The useChessAudio hook will automatically load them when the application starts.

## Testing

Use the browser developer console to test audio playback:

```javascript
// Test if audio files are accessible
fetch("/sounds/chess/move.mp3").then((r) => console.log("move.mp3:", r.status));
```

## Fallback Behavior

If audio files are missing, the application will:

- Log warnings to the console
- Continue functioning without audio
- Gracefully handle audio loading errors

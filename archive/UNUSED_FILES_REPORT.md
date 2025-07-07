# Unused Files and Components Report

## Summary
This report identifies unused or potentially orphaned files in the EndgameTrainer codebase based on import analysis.

## UI Components (shared/components/ui/)
The following UI components appear to be unused (no imports found outside their directory):

1. **DarkModeToggle.tsx** - Only imported in AppLayout.tsx (which itself might be unused)
2. **EngineErrorBoundary.tsx** - No imports found
3. **ErrorBoundary.tsx** - No imports found (except in node_modules)
4. **ProgressCard.tsx** - No imports found
5. **Toast.tsx** - No imports found
6. **button.tsx** - No imports found

## Services (shared/services/)
The following services appear to be unused:

### Mobile Services (likely placeholders for future mobile implementation)
1. **notificationService.ts** - No imports found
2. **performanceService.ts** - No imports found
3. **storageService.ts** - No imports found

### Platform Services
1. **PlatformService.ts** - No imports found
2. **WebPlatformService.ts** - No imports found

### Logging
1. **Logger.ts** - No imports found (except in node_modules)

## Utilities (shared/utils/)
1. **bridgeBuildingEvaluation.ts** - No imports found (might be for future Brückenbau-Trainer feature)

## Mobile Implementation (app/mobile/)
The mobile folder contains a basic React Native app structure with:
- App.tsx (main app file)
- HomeScreen.tsx
- TrainingScreen.tsx
- SettingsScreen.tsx
- Test files for each screen

**Status**: This appears to be a placeholder implementation with basic navigation but no actual chess functionality integrated. The CLAUDE.md mentions 0% test coverage for mobile.

## Duplicate Types
No duplicate type definitions were found in the codebase.

## Data Files
All data files in shared/data/endgames appear to be properly used:
- Imported by TrainingContext.tsx
- Imported by mobile services (though those services are unused)

## Recommendations

### Immediate Actions
1. **Remove unused UI components** if they're not planned for immediate use:
   - EngineErrorBoundary.tsx
   - ErrorBoundary.tsx
   - ProgressCard.tsx
   - Toast.tsx
   - button.tsx

2. **Consider removing or documenting as "future implementation"**:
   - Mobile services (notificationService, performanceService, storageService)
   - Platform services (unless needed for future platform abstraction)
   - Logger service (unless planning to implement proper logging)

### Keep for Future Features
1. **DarkModeToggle.tsx** - Might be used when dark mode is properly implemented
2. **bridgeBuildingEvaluation.ts** - Documented as part of upcoming Brückenbau-Trainer feature
3. **Mobile folder** - Documented as future mobile implementation

### Code Organization
1. Consider creating a `future/` or `experimental/` directory for components that are placeholders for future features
2. Add comments to unused files explaining their intended future use
3. Consider using feature flags or environment variables to conditionally include experimental code

## Technical Debt Notes
- The mobile implementation exists but has 0% test coverage and no chess functionality
- Many services appear to be created in anticipation of future needs but are currently unused
- The platform abstraction layer exists but isn't being used by the current web implementation
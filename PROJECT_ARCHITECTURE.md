# 🏗️ PROJECT ARCHITECTURE DOCUMENTATION

## 📋 **OVERVIEW**
Endgame Chess Training App - Cross-platform Web & Mobile Application

**Current Status:** Production-ready web app, Android-ready architecture  
**Tech Stack:** Next.js, React, TypeScript, Firebase, Stockfish Engine  
**Total Files:** 113 TypeScript files, ~42% test coverage  

---

## 🎯 **DESIGN PRINCIPLES**

### 1. **Mobile-First Architecture**
- Memory management for mobile devices
- Offline-first data storage
- Performance-optimized evaluations
- Progressive loading strategies

### 2. **Modular Design**
- Single Responsibility Principle
- Clean separation of concerns
- Testable, maintainable code
- Reusable cross-platform components

### 3. **Cross-Platform Ready**
- Shared business logic (`shared/`)
- Platform-specific implementations (`app/mobile/`, `pages/`)
- Universal components and hooks
- Consistent API interfaces

---

## 📁 **PROJECT STRUCTURE**

```
Schachtools/
├── shared/                 # 🌐 Cross-platform shared code
│   ├── components/         # ⚛️ Reusable UI components
│   │   ├── chess/         # ♟️ Chess-specific components
│   │   │   ├── layout/        # 🖼️ Layout components (Header, AppLayout)
│   │   │   ├── training/      # 🎯 Training components
│   │   │   │   ├── TrainingBoard/  # 🏁 Main training interface
│   │   │   │   │   ├── hooks/      # 🪝 Custom hooks for logic
│   │   │   │   │   ├── components/ # 🧩 Sub-components
│   │   │   │   │   └── __tests__/  # 🧪 Comprehensive tests
│   │   │   │   ├── AnalysisPanel/  # 📊 Move analysis
│   │   │   │   └── __tests__/      # 🧪 Training tests
│   │   │   ├── navigation/    # 🧭 Navigation components
│   │   │   └── ui/           # 🎨 Basic UI components
│   │   │
│   │   ├── lib/              # 🔧 Core business logic
│   │   │   ├── chess/        # ♟️ Chess engine & logic
│   │   │   │   ├── ScenarioEngine/  # 🧠 Main chess engine
│   │   │   │   │   ├── evaluationService.ts  # 📊 Position evaluation
│   │   │   │   │   ├── tablebaseService.ts   # 📚 Endgame tablebase
│   │   │   │   │   └── types.ts              # 🏷️ Type definitions
│   │   │   │   ├── engine/   # ⚙️ Stockfish integration
│   │   │   │   └── __tests__/ # 🧪 Engine tests
│   │   │   └── training/     # 🎓 Training algorithms
│   │   │
│   │   ├── services/         # 🔌 External services
│   │   │   ├── mobile/       # 📱 Mobile-specific services
│   │   │   │   ├── storageService.ts      # 💾 Offline storage
│   │   │   │   ├── notificationService.ts # 🔔 Push notifications
│   │   │   │   └── performanceService.ts  # ⚡ Performance monitoring
│   │   │   └── errorService.ts # ❌ Error handling
│   │   │
│   │   ├── hooks/           # 🪝 Reusable React hooks
│   │   ├── data/           # 📊 Data structures & types
│   │   ├── contexts/       # 🌐 React contexts
│   │   ├── types/          # 🏷️ TypeScript definitions
│   │   └── utils/          # 🛠️ Utility functions
│   │
│   ├── pages/              # 🌐 Next.js web app pages
│   ├── app/mobile/         # 📱 Mobile app (React Native ready)
│   └── public/            # 📂 Static assets (Stockfish WASM)
│
└── __tests__/            # 🧪 Test files
```

---

## 🧠 **CORE ARCHITECTURE COMPONENTS**

### 1. **ScenarioEngine 2.0** (`shared/lib/chess/ScenarioEngine/`)
**Purpose:** Core chess training engine with AI evaluation  
**Key Features:**
- Mobile-optimized memory management
- Dual evaluation (Stockfish + Tablebase)
- Error-resilient move validation
- Instance tracking for performance

**Architecture:**
```typescript
ScenarioEngine
├── evaluationService  # Position analysis
├── tablebaseService   # Endgame database queries
├── engine            # Stockfish wrapper
└── chess             # Chess.js game state
```

### 2. **TrainingBoard System** (`shared/components/training/TrainingBoard/`)
**Purpose:** Interactive chess training interface  
**Architecture:** Hook-based modular design

**Hook Structure:**
- `useScenarioEngine` - Engine management
- `useTrainingState` - UI state management  
- `useEnhancedMoveHandler` - Move processing
- `useChessGame` - Game state management
- `useEvaluation` - Position evaluation

### 3. **Mobile Storage Service** (`shared/services/mobile/storageService.ts`)
**Purpose:** Offline-first data persistence  
**Features:**
- 50MB storage limit management
- Data compression for mobile
- Progress tracking & sync
- Offline position caching

---

## 🎯 **ANDROID APP MIGRATION STRATEGY**

### Phase 1: **React Native Setup**
```
app/mobile/
├── App.tsx              # Main app entry
├── components/          # Mobile-specific components
├── screens/            # Screen components
└── navigation/         # Mobile navigation
```

### Phase 2: **Shared Logic Integration**
- Import `shared/` modules directly
- Use mobile services (`storageService`, `notificationService`)
- Implement platform-specific UI components

### Phase 3: **Platform Optimizations**
- Native module integrations
- Performance optimizations
- Platform-specific features

---

## 🧪 **TESTING STRATEGY**

### Current Coverage: **42.17%** ✅
- **Comprehensive Tests:** Major components have 80%+ coverage
- **Test Categories:**
  - Unit tests for business logic
  - Integration tests for components
  - Performance tests for mobile
  - Error handling tests

### Testing Architecture:
```
__tests__/
├── *.test.tsx           # Simple component tests
├── *.comprehensive.test.tsx  # Full feature tests
└── *.integration.test.tsx    # Cross-component tests
```

---

## 🔧 **DEVELOPMENT GUIDELINES**

### 1. **File Naming Convention**
- Components: `PascalCase.tsx`
- Hooks: `use[Name].ts`
- Services: `[name]Service.ts`
- Tests: `[name].test.tsx` / `[name].comprehensive.test.tsx`

### 2. **Code Organization**
- **Single Responsibility:** One concern per file/class
- **Mobile-First:** Consider mobile constraints in all decisions
- **Error Handling:** Graceful degradation everywhere
- **Documentation:** Comprehensive JSDoc for all public APIs

### 3. **Performance Considerations**
- **Memory Management:** Track instances, clean up resources
- **Lazy Loading:** Load components/data on demand
- **Caching:** Cache expensive operations (evaluations, positions)
- **Offline Support:** Essential features work without network

---

## 📊 **PERFORMANCE METRICS**

### Current Status:
- **Build Time:** ~2 seconds (development)
- **Bundle Size:** Optimized for web
- **Memory Usage:** Monitored via ScenarioEngine instance tracking
- **Test Coverage:** 42.17% (target: 60%+)

### Mobile Optimizations:
- **Evaluation Timeout:** 1000ms (vs 5000ms on desktop)
- **Storage Compression:** Enabled for mobile
- **Instance Management:** Max instances tracking
- **Cleanup Strategies:** Automatic old data removal

---

## 🚀 **PRODUCTION READINESS CHECKLIST**

### ✅ **COMPLETED:**
- Modular architecture implemented
- Mobile services prepared
- Comprehensive error handling
- Performance monitoring
- Offline support foundation
- Test infrastructure established

### 🔄 **IN PROGRESS:**
- Test coverage improvement (42% → 60%+)
- Documentation completion
- Mobile app shell preparation

### 📋 **TODO FOR ANDROID:**
- React Native project setup
- Native module integrations
- Platform-specific optimizations
- App store deployment pipeline

---

## 📚 **DEPENDENCIES & EXTERNAL SERVICES**

### Core Dependencies:
- **chess.js** - Chess game logic
- **stockfish.js** - Chess engine
- **react-chessboard** - Chess UI components
- **firebase** - Backend services

### Mobile-Specific:
- **@react-native-async-storage** - Local storage
- **@react-native-push-notification** - Notifications
- **react-native-fs** - File system access

---

## 🔍 **CODE QUALITY METRICS**

### File Size Analysis:
- **Largest Files:** 15KB (tests), 13KB (components)
- **Average Component Size:** ~200 lines
- **Complexity:** Well-distributed, no single mega-files
- **Maintainability Index:** High (modular design)

### Architecture Quality:
- **Coupling:** Low (clean interfaces)
- **Cohesion:** High (single responsibility)
- **Testability:** High (dependency injection)
- **Reusability:** High (shared components)

---

*Last Updated: [Current Date]*  
*Version: 2.0.0*  
*Author: AI Development Team* 
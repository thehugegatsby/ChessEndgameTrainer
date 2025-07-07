# 📋 Kurzfristige Aufgaben - Monat 1

**Priorität**: HOCH  
**Zeitrahmen**: 2-4 Wochen  
**Fokus**: State Management, Performance, Platform Abstraction  

## 1. Zustand Migration Phase 2

### Kontext
Zustand ist installiert und erste Migration wurde durchgeführt, aber nicht alle Komponenten nutzen es.

### Tasks

#### **Task 1.1**: Migration Assessment
- [ ] Analyse aller Context-basierten Komponenten
  ```bash
  # Find all Context usage
  grep -r "useContext\|createContext" shared/ pages/ --include="*.tsx" --include="*.ts"
  ```
- [ ] Erstelle Migration Priority List
- [ ] Identifiziere shared state zwischen Komponenten

#### **Task 1.2**: TrainingContext → Zustand
- [ ] Neuen Zustand Store erstellen
  ```typescript
  // File: /shared/store/trainingStore.ts
  interface TrainingState {
    currentPosition: string;
    moveHistory: Move[];
    evaluations: EvaluationDisplay[];
    isPlayerTurn: boolean;
    // ... rest of TrainingContext state
  }
  
  export const useTrainingStore = create<TrainingState>((set, get) => ({
    // State
    currentPosition: '',
    moveHistory: [],
    evaluations: [],
    isPlayerTurn: true,
    
    // Actions
    makeMove: (move: Move) => set(state => ({
      moveHistory: [...state.moveHistory, move],
      isPlayerTurn: !state.isPlayerTurn
    })),
    
    // Selectors
    getLastMove: () => {
      const state = get();
      return state.moveHistory[state.moveHistory.length - 1];
    }
  }));
  ```

- [ ] Context Provider durch Zustand ersetzen
- [ ] Alle Consumer-Komponenten migrieren
- [ ] Tests anpassen

#### **Task 1.3**: Performance Monitoring
- [ ] React DevTools Profiler einrichten
- [ ] Baseline Measurements (vor Migration)
- [ ] Post-Migration Measurements
- [ ] Performance Report erstellen

### Acceptance Criteria
- [ ] Alle Context-basierten States in Zustand
- [ ] Performance gleich oder besser
- [ ] Keine Breaking Changes
- [ ] DevTools Integration funktioniert

---

## 2. Code-Splitting Implementation

### Problem
Bundle Size 500KB - alles lädt auf einmal

### Tasks

#### **Task 2.1**: Analyze Bundle
- [ ] Bundle Analyzer einrichten
  ```json
  // package.json
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
  ```
- [ ] Identify größte Chunks
- [ ] Priorisiere Splitting-Kandidaten

#### **Task 2.2**: Dynamic Imports für Heavy Components
- [ ] Stockfish Engine lazy loading
  ```typescript
  // File: /shared/components/training/TrainingBoard/index.tsx
  const StockfishEngine = dynamic(
    () => import('@shared/lib/stockfish'),
    { 
      loading: () => <EngineLoadingSpinner />,
      ssr: false 
    }
  );
  ```

- [ ] Tablebase Service splitting
  ```typescript
  const TablebaseService = dynamic(
    () => import('@shared/services/tablebase'),
    { ssr: false }
  );
  ```

- [ ] Training Components splitting
  ```typescript
  // Split heavy training components
  const TrainingBoard = dynamic(
    () => import('./TrainingBoard'),
    { loading: () => <BoardSkeleton /> }
  );
  ```

#### **Task 2.3**: Route-based Splitting
- [ ] Implement für alle Routes
  ```typescript
  // pages/train/[id].tsx
  const TrainingPage = dynamic(
    () => import('@shared/pages/TrainingPageZustand'),
    { loading: () => <PageLoader /> }
  );
  ```

#### **Task 2.4**: Preloading Strategy
- [ ] Critical paths preloaden
  ```typescript
  // Preload on hover
  const handleHover = () => {
    import('@shared/lib/stockfish');
  };
  ```

### Target Metrics
- [ ] Initial Bundle < 200KB
- [ ] Lazy Chunks < 100KB each
- [ ] Total Size < 350KB
- [ ] TTI (Time to Interactive) < 3s

---

## 3. Platform Abstraction Layer

### Ziel
Vorbereitung für Mobile ohne Code-Duplikation

### Tasks

#### **Task 3.1**: Define Platform Interface
- [ ] Create abstraction interfaces
  ```typescript
  // File: /shared/services/platform/types.ts
  export interface PlatformService {
    storage: StorageService;
    navigation: NavigationService;
    device: DeviceService;
    permissions: PermissionsService;
  }
  
  export interface StorageService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  }
  
  export interface DeviceService {
    platform: 'web' | 'ios' | 'android';
    isTablet: boolean;
    hasNotch: boolean;
    screenSize: { width: number; height: number };
  }
  ```

#### **Task 3.2**: Web Implementation
- [ ] Implement web platform service
  ```typescript
  // File: /shared/services/platform/web.ts
  export class WebPlatformService implements PlatformService {
    storage = {
      get: async (key: string) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      set: async (key: string, value: any) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      remove: async (key: string) => {
        localStorage.removeItem(key);
      },
      clear: async () => {
        localStorage.clear();
      }
    };
    
    device = {
      platform: 'web' as const,
      isTablet: window.innerWidth > 768,
      hasNotch: false,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
  ```

#### **Task 3.3**: Platform Provider
- [ ] Context für Platform Service
  ```typescript
  // File: /shared/contexts/PlatformContext.tsx
  const PlatformContext = createContext<PlatformService>(null!);
  
  export const PlatformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const platform = useMemo(() => {
      if (typeof window !== 'undefined') {
        return new WebPlatformService();
      }
      // Mobile implementation will go here
      return null!;
    }, []);
    
    return (
      <PlatformContext.Provider value={platform}>
        {children}
      </PlatformContext.Provider>
    );
  };
  
  export const usePlatform = () => useContext(PlatformContext);
  ```

#### **Task 3.4**: Migrate Direct API Usage
- [ ] Replace all localStorage calls
- [ ] Replace all window references
- [ ] Replace all document references
- [ ] Add platform checks

### Acceptance Criteria
- [ ] No direct browser API usage in shared/
- [ ] All platform code goes through abstraction
- [ ] Web implementation 100% complete
- [ ] Mobile stubs ready

---

## 4. Performance Optimizations

### Tasks

#### **Task 4.1**: Implement Service Worker
- [ ] Basic SW for caching
  ```javascript
  // public/sw.js
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/stockfish.wasm'
        ]);
      })
    );
  });
  ```

#### **Task 4.2**: Image Optimization
- [ ] Convert piece images to WebP
- [ ] Implement responsive images
- [ ] Lazy load board backgrounds

#### **Task 4.3**: Memory Management
- [ ] Fix potential Engine cleanup leaks
  ```typescript
  // Add proper cleanup
  useEffect(() => {
    const engine = new Engine();
    
    return () => {
      engine.quit();
      engine.terminate();
    };
  }, []);
  ```

#### **Task 4.4**: Debounce Optimizations
- [ ] Review all debounced functions
- [ ] Optimize debounce delays
- [ ] Add loading states

---

## 5. Testing Infrastructure

### Tasks

#### **Task 5.1**: Mobile Test Setup
- [ ] Jest config für React Native
- [ ] Mock Platform Services
- [ ] First mobile component tests

#### **Task 5.2**: E2E Test Expansion
- [ ] Playwright mobile viewport tests
- [ ] Performance benchmarks
- [ ] Security test suite

#### **Task 5.3**: Integration Tests
- [ ] Zustand store integration
- [ ] Platform service integration
- [ ] Code-splitting verification

### Target Coverage
- [ ] Business Logic: 85%
- [ ] UI Components: 70%
- [ ] Mobile Stubs: 50%

---

## 📊 Erfolgs-Metriken Ende Monat 1

| Metrik | Start | Ziel | 
|--------|-------|------|
| Bundle Size | 500KB | <350KB |
| Test Coverage | 78% | 85% |
| Zustand Migration | 30% | 100% |
| Platform Abstraction | 0% | 100% (Web) |
| Code Splitting | 0% | 100% |
| Performance Score | 85 | 95+ |

## ⏱️ Sprint Planning

### Sprint 1 (Woche 1-2)
- Zustand Migration (40h)
- Code-Splitting Start (20h)

### Sprint 2 (Woche 3-4)
- Platform Abstraction (30h)
- Performance Optimizations (20h)
- Testing Infrastructure (10h)

## 🚀 Definition of Done

- [ ] Code Review durchgeführt
- [ ] Tests geschrieben und grün
- [ ] Dokumentation aktualisiert
- [ ] Performance nicht verschlechtert
- [ ] Keine neuen TypeScript Errors
- [ ] Bundle Size Ziel erreicht

---

**Review**: Ende jedes Sprints  
**Retrospektive**: Ende Monat 1  
**Nächste Phase**: Mobile Implementation (Monat 2)
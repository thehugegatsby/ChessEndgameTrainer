/**
 * @file Command Palette Component
 * @description Modern command palette with Ctrl+K shortcut for quick navigation and actions
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '@shared/store/StoreContext';
import { showSuccessToast, showInfoToast } from '@shared/utils/toast';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'actions' | 'settings' | 'training';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  // Store actions
  const resetGame = useStore((state) => state.game.resetGame);
  const resetProgress = useStore((state) => state.progress.resetProgress);
  const currentFen = useStore((state) => state.game.currentFen);

  const commands: CommandItem[] = [
    // Navigation commands
    {
      id: 'nav-home',
      label: 'Zur Startseite',
      description: 'Gehe zur Hauptseite',
      category: 'navigation',
      action: () => router.push('/'),
      keywords: ['home', 'start', 'haupt'],
    },
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      description: 'Öffne das Dashboard',
      category: 'navigation', 
      action: () => router.push('/dashboard'),
      keywords: ['dashboard', 'übersicht'],
    },
    {
      id: 'nav-tablebase-demo',
      label: 'Tablebase Demo',
      description: 'Teste die Tablebase-Funktionen',
      category: 'navigation',
      action: () => router.push('/tablebase-demo'),
      keywords: ['tablebase', 'demo', 'test'],
    },
    {
      id: 'nav-training-1',
      label: 'Training Position 1',
      description: 'Starte Training mit Position 1',
      category: 'training',
      action: () => router.push('/train/1'),
      keywords: ['training', 'position', '1'],
    },
    {
      id: 'nav-training-2',
      label: 'Training Position 2', 
      description: 'Starte Training mit Position 2',
      category: 'training',
      action: () => router.push('/train/2'),
      keywords: ['training', 'position', '2'],
    },
    
    // Game actions
    {
      id: 'action-reset-game',
      label: 'Spiel zurücksetzen',
      description: 'Setze das aktuelle Spiel zurück',
      category: 'actions',
      action: () => {
        resetGame();
        showSuccessToast('Spiel zurückgesetzt');
        onOpenChange(false);
      },
      keywords: ['reset', 'zurücksetzen', 'neu', 'restart'],
    },
    {
      id: 'action-copy-fen',
      label: 'FEN kopieren',
      description: 'Kopiere die aktuelle Position als FEN',
      category: 'actions',
      action: () => {
        if (currentFen) {
          navigator.clipboard.writeText(currentFen);
          showSuccessToast('FEN in Zwischenablage kopiert');
        } else {
          showInfoToast('Keine Position verfügbar');
        }
        onOpenChange(false);
      },
      keywords: ['fen', 'kopieren', 'copy', 'position'],
    },
    {
      id: 'action-clear-progress',
      label: 'Fortschritt löschen',
      description: 'Lösche den gesamten Trainingsfortschritt (Vorsicht!)',
      category: 'settings',
      action: () => {
        if (confirm('Wirklich allen Fortschritt löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
          resetProgress();
          showSuccessToast('Fortschritt gelöscht');
        }
        onOpenChange(false);
      },
      keywords: ['progress', 'fortschritt', 'löschen', 'clear', 'reset'],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    training: 'Training',
    actions: 'Aktionen',
    settings: 'Einstellungen',
  };

  // Handle escape key and clicks outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg">
          <div className="flex items-center border-b px-3 dark:border-gray-700">
            <svg 
              className="mr-2 h-4 w-4 shrink-0 text-gray-500"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Command.Input
              placeholder="Suche nach Befehlen..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 dark:text-white"
            />
          </div>
          
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              Keine Befehle gefunden.
            </Command.Empty>
            
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <Command.Group 
                key={category} 
                heading={categoryLabels[category as keyof typeof categoryLabels]}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500 dark:[&_[cmdk-group-heading]]:text-gray-400"
              >
                {commands.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => {
                      cmd.action();
                      onOpenChange(false);
                    }}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium dark:text-white">{cmd.label}</span>
                      {cmd.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          
          <div className="border-t p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <div className="flex justify-between">
              <span>↑↓ navigieren</span>
              <span>↵ auswählen</span>
              <span>ESC schließen</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  // Use react-hotkeys-hook for more reliable keyboard handling
  useHotkeys(
    'ctrl+k, cmd+k',
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    { enableOnContentEditable: true, enableOnFormTags: ['INPUT', 'TEXTAREA'] }
  );

  return {
    open,
    setOpen,
  };
}

/**
 * Hook for global chess-specific keyboard shortcuts
 */
export function useChessHotkeys() {
  const router = useRouter();
  const resetGame = useStore((state) => state.game.resetGame);
  const currentFen = useStore((state) => state.game.currentFen);

  // Navigation shortcuts
  useHotkeys('ctrl+shift+h, cmd+shift+h', () => {
    router.push('/');
  }, { description: 'Zur Startseite navigieren' });

  useHotkeys('ctrl+shift+d, cmd+shift+d', () => {
    router.push('/dashboard');
  }, { description: 'Dashboard öffnen' });

  // Game shortcuts
  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault(); // Prevent browser reload
    resetGame();
    showSuccessToast('Spiel zurückgesetzt');
  }, { description: 'Spiel zurücksetzen' });

  // FEN copy shortcut
  useHotkeys('ctrl+shift+c, cmd+shift+c', () => {
    if (currentFen) {
      navigator.clipboard.writeText(currentFen);
      showSuccessToast('FEN kopiert');
    }
  }, { description: 'FEN kopieren' });

  // Training shortcuts
  useHotkeys('ctrl+1', () => {
    router.push('/train/1');
  }, { description: 'Training Position 1' });

  useHotkeys('ctrl+2', () => {
    router.push('/train/2');
  }, { description: 'Training Position 2' });
}
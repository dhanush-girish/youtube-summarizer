'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of a view panel
export type ViewType = 'editor' | 'timeline' | 'graph' | 'ocr' | 'youtube';

export interface ViewPanel {
  id: string; // Unique ID for the panel
  type: ViewType;
  noteId?: string; // Optional: If the view is an editor and has a specific note loaded
}

interface WorkspaceState {
  panels: ViewPanel[];
  activePanelId: string | null;
}

interface WorkspaceContextType {
  state: WorkspaceState;
  addPanel: (type: ViewType, noteId?: string) => void;
  removePanel: (id: string) => void;
  setActivePanel: (id: string) => void;
  setPanelNoteId: (id: string, noteId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>({
    panels: [{ id: 'default-editor', type: 'editor' }], // Start with one editor
    activePanelId: 'default-editor',
  });

  const addPanel = (type: ViewType, noteId?: string) => {
    const newId = `panel-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      panels: [...prev.panels, { id: newId, type, noteId }],
      activePanelId: newId,
    }));
  };

  const removePanel = (id: string) => {
    setState((prev) => {
      const newPanels = prev.panels.filter((p) => p.id !== id);
      return {
        ...prev,
        panels: newPanels,
        // If the active panel was closed, pick the last remaining panel, or null
        activePanelId:
          prev.activePanelId === id
            ? newPanels.length > 0
              ? newPanels[newPanels.length - 1].id
              : null
            : prev.activePanelId,
      };
    });
  };

  const setActivePanel = (id: string) => {
    setState((prev) => ({ ...prev, activePanelId: id }));
  };

  const setPanelNoteId = (id: string, noteId: string) => {
    setState((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === id ? { ...p, noteId } : p)),
    }));
  };

  return (
    <WorkspaceContext.Provider value={{ state, addPanel, removePanel, setActivePanel, setPanelNoteId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(optional = false) {
  const context = useContext(WorkspaceContext);
  if (context === undefined && !optional) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context as WorkspaceContextType;
}

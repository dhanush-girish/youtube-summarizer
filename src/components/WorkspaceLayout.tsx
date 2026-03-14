'use client';

import React, { useState } from 'react';
import { useWorkspace, ViewPanel } from '@/context/WorkspaceContext';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import NoteEditor from './NoteEditor';
import TimelineView from './TimelineView';
import KnowledgeGraph from './KnowledgeGraph';
import OCRScanner from './OCRScanner';
import YouTubeImporter from './YouTubeImporter';

const PanelContent = ({ panel }: { panel: ViewPanel }) => {
  switch (panel.type) {
    case 'editor':
      return <NoteEditor panelId={panel.id} noteId={panel.noteId} />;
    case 'timeline':
      return <TimelineView />;
    case 'graph':
      return <KnowledgeGraph />;
    case 'ocr':
      return <OCRScanner />;
    case 'youtube':
      return <YouTubeImporter />;
    default:
      return <div>Unknown Panel</div>;
  }
};

export default function WorkspaceLayout() {
  const { state, removePanel, setActivePanel } = useWorkspace();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);

  if (state.panels.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No panels open. Select a view from the sidebar to begin.
      </div>
    );
  }

  const panelsToRender = maximizedPanelId
    ? state.panels.filter((p) => p.id === maximizedPanelId)
    : state.panels;

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden', gap: '4px', padding: '4px' }}>
      {panelsToRender.map((panel) => {
        const isActive = state.activePanelId === panel.id;
        const isMaximized = maximizedPanelId === panel.id;
        return (
          <div
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`glass-panel workspace-panel ${isActive ? 'active' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: isMaximized ? '100%' : '300px',
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
              transition: 'border-color 0.2s, min-width 0.3s ease',
              overflow: 'hidden'
            }}
          >
            {/* Panel Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--panel-border)',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                {panel.type}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setMaximizedPanelId(isMaximized ? null : panel.id);
                  }} 
                  style={{ background: 'none', border: 'none', color: isMaximized ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isMaximized) setMaximizedPanelId(null);
                    removePanel(panel.id); 
                  }} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
               <PanelContent panel={panel} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

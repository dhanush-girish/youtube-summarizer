'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspace, ViewPanel } from '@/context/WorkspaceContext';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import NoteEditor from './NoteEditor';
import TimelineView from './TimelineView';
import KnowledgeGraph from './KnowledgeGraph';
import OCRScanner from './OCRScanner';
import YouTubeImporter from './YouTubeImporter';
import SavedNotes from './SavedNotes';

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
    case 'notes':
      return <SavedNotes />;
    default:
      return <div>Unknown Panel</div>;
  }
};

// Draggable resize handle between panels
function ResizeHandle({ onDrag }: { onDrag: (deltaX: number) => void }) {
  const handleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDrag(delta);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onDrag]);

  return (
    <div
      ref={handleRef}
      onMouseDown={onMouseDown}
      style={{
        width: '6px',
        cursor: 'col-resize',
        background: 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
    >
      <div style={{
        width: '2px',
        height: '40px',
        borderRadius: '2px',
        background: 'var(--panel-border)',
        transition: 'background 0.2s',
      }} />
    </div>
  );
}

const DEFAULT_PANEL_WIDTH = 450;
const MIN_PANEL_WIDTH = 250;

export default function WorkspaceLayout() {
  const { state, removePanel, setActivePanel } = useWorkspace();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  const [panelWidths, setPanelWidths] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Get or initialize width for a panel
  const getWidth = (panelId: string) => panelWidths[panelId] || DEFAULT_PANEL_WIDTH;

  // Handle resize drag between two panels
  const handleResize = useCallback((leftPanelId: string, rightPanelId: string, deltaX: number) => {
    setPanelWidths((prev) => {
      const leftW = (prev[leftPanelId] || DEFAULT_PANEL_WIDTH) + deltaX;
      const rightW = (prev[rightPanelId] || DEFAULT_PANEL_WIDTH) - deltaX;
      // Enforce minimum widths
      if (leftW < MIN_PANEL_WIDTH || rightW < MIN_PANEL_WIDTH) return prev;
      return { ...prev, [leftPanelId]: leftW, [rightPanelId]: rightW };
    });
  }, []);

  // Auto-scroll to the right when a new panel is added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [state.panels.length]);

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
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        gap: '0px',
        padding: '4px',
      }}
    >
      {panelsToRender.map((panel, index) => {
        const isActive = state.activePanelId === panel.id;
        const isMaximized = maximizedPanelId === panel.id;

        return (
          <React.Fragment key={panel.id}>
            <div
              onClick={() => setActivePanel(panel.id)}
              className={`glass-panel workspace-panel ${isActive ? 'active' : ''}`}
              style={{
                width: isMaximized ? '100%' : `${getWidth(panel.id)}px`,
                minWidth: isMaximized ? '100%' : `${MIN_PANEL_WIDTH}px`,
                flexShrink: 0,
                flexGrow: isMaximized ? 1 : 0,
                display: 'flex',
                flexDirection: 'column',
                border: isActive ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                transition: 'border-color 0.2s',
                overflow: 'hidden',
              }}
            >
              {/* Panel Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--panel-border)',
                background: 'rgba(0,0,0,0.2)',
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {panel.type === 'notes' ? 'Notes' : panel.type}
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

            {/* Resize handle between panels (not after the last one, not in maximized mode) */}
            {!isMaximized && index < panelsToRender.length - 1 && (
              <ResizeHandle
                onDrag={(deltaX) => {
                  const nextPanel = panelsToRender[index + 1];
                  handleResize(panel.id, nextPanel.id, deltaX);
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}


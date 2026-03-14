'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Clock, RefreshCcw } from 'lucide-react';
import NoteRenderer from './NoteRenderer';

interface Version {
  id: string;
  created_at: string;
  content_snapshot: string;
}

interface VersionHistoryModalProps {
  noteId: string;
  onClose: () => void;
  onRestore: (content: string) => void;
}

export default function VersionHistoryModal({ noteId, onClose, onRestore }: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchVersions() {
      const { data, error } = await supabase
        .from('note_versions')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setVersions(data);
        if (data.length > 0) {
          setSelectedVersion(data[0]);
        }
      }
      setLoading(false);
    }
    fetchVersions();
  }, [noteId, supabase]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="glass-panel" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
          Loading History...
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ display: 'flex', width: '100%', maxWidth: '900px', height: '80vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
        
        {/* Sidebar List */}
        <div style={{ width: '250px', borderRight: '1px solid var(--panel-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Clock size={16} /> Version History
          </div>
          <div style={{ flex: 1 }}>
            {versions.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No history found.</div>
            ) : (
              versions.map((ver) => (
                <div 
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: selectedVersion?.id === ver.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    borderLeft: selectedVersion?.id === ver.id ? '3px solid var(--accent)' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {new Date(ver.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ver.content_snapshot.length} chars
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
              Snapshot Preview
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-primary"
                onClick={() => {
                  if (selectedVersion) {
                    onRestore(selectedVersion.content_snapshot);
                    onClose();
                  }
                }}
                style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={!selectedVersion}
              >
                <RefreshCcw size={14} /> Restore This Version
              </button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {selectedVersion ? (
              <NoteRenderer content={selectedVersion.content_snapshot} />
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Select a version to preview.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

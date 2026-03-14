'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/context/WorkspaceContext';

interface NoteMeta {
  id: string;
  title: string;
  created_at: string;
  content_preview: string;
}

export default function TimelineView() {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { addPanel } = useWorkspace();

  useEffect(() => {
    async function fetchTimeline() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('id, title, created_at, content')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setNotes(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            created_at: n.created_at,
            content_preview: (n.content || '').substring(0, 100) + '...',
          }))
        );
      }
      setLoading(false);
    }
    fetchTimeline();
  }, [supabase]);

  if (loading) return <div className="panel-inner">Loading Timeline...</div>;

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Your Note Timeline</h2>
      
      {notes.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No notes exist yet. Create one to see it on the timeline!</div>
      ) : (
        <div className="timeline-container">
          {notes.map((note) => {
            const dateObj = new Date(note.created_at);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <div key={note.id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content glass-panel" onClick={() => addPanel('editor', note.id)}>
                  <div className="timeline-date">{dateStr}</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--accent)' }}>{note.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                    {note.content_preview}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

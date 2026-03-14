'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/context/WorkspaceContext';
import { FileText, Youtube, Loader2, Trash2 } from 'lucide-react';

interface SavedNote {
  id: string;
  title: string;
  created_at: string;
  content: string;
}

export default function SavedNotes() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { addPanel } = useWorkspace();

  const fetchNotes = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notes')
      .select('id, title, created_at, content')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setNotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();

    // Subscribe to realtime changes so new notes from YT summarizer appear instantly
    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note permanently?')) return;

    await supabase.from('notes').delete().eq('id', noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const isYouTubeNote = (content: string) => {
    return content.includes('youtube.com/embed/') || content.includes('NexusNote LLM Engine');
  };

  if (loading) {
    return (
      <div className="panel-inner">
        <Loader2 size={24} className="spin" />
        <span>Loading notes...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Saved Notes</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>

      {notes.length === 0 ? (
        <div className="panel-inner">
          <FileText size={48} style={{ opacity: 0.3 }} />
          <p style={{ color: 'var(--text-muted)' }}>No saved notes yet. Create one from the Editor or YouTube Summarizer!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map((note) => {
            const isYT = isYouTubeNote(note.content);
            const dateStr = new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const preview = note.content
              .replace(/<[^>]*>/g, '')
              .replace(/[#*_~`>/\[\]()-]/g, '')
              .substring(0, 120)
              .trim();

            return (
              <div
                key={note.id}
                className="glass-panel"
                onClick={() => addPanel('editor', note.id)}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isYT ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isYT ? <Youtube size={20} color="#ef4444" /> : <FileText size={20} color="var(--accent)" />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {note.title || 'Untitled'}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(note.id, e)}
                      title="Delete note"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', flexShrink: 0, opacity: 0.5, transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {preview || 'Empty note'}
                  </p>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>{dateStr}</span>
                    {isYT && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        YouTube
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import NoteRenderer from './NoteRenderer';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Save, History, Edit3, Eye, Download, Upload } from 'lucide-react';
import VersionHistoryModal from './VersionHistoryModal';

interface NoteEditorProps {
  panelId: string;
  noteId?: string; // This could be a UUID or a "title:MyTitle" string from our internal link logic
}

export default function NoteEditor({ panelId, noteId }: NoteEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const { setPanelNoteId } = useWorkspace();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dbNoteId, setDbNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // local UI state
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    async function fetchNote() {
      if (!noteId) return;
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setIsLoading(false); return; }

      let query = supabase.from('notes').select('*').eq('user_id', userData.user.id);
      
      if (noteId.startsWith('title:')) {
        const searchTitle = noteId.substring(6);
        query = query.eq('title', searchTitle);
      } else {
        query = query.eq('id', noteId);
      }

      const { data, error } = await query.single();
      
      if (data && !error) {
        setTitle(data.title);
        setContent(data.content || '');
        setDbNoteId(data.id);
        if (noteId.startsWith('title:')) {
          setPanelNoteId(panelId, data.id); // Update context to use real ID
        }
      } else if (noteId.startsWith('title:')) {
        // Prepare to create a new note with this title
        setTitle(noteId.substring(6));
      }
      setIsLoading(false);
    }
    fetchNote();
  }, [noteId, supabase, panelId, setPanelNoteId]);

  const handleSave = async () => {
    setIsSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return setIsSaving(false);

    const activeTitle = title.trim() || 'Untitled Note';
    let currentId = dbNoteId;

    if (currentId) {
      const { error: updateError } = await supabase.from('notes').update({
        title: activeTitle,
        content: content,
        updated_at: new Date().toISOString()
      }).eq('id', currentId);
      
      if (updateError) {
        alert('Failed to update note: ' + updateError.message);
        return setIsSaving(false);
      }
    } else {
      // Insert new
      const { data, error } = await supabase.from('notes').insert({
        title: activeTitle,
        content: content,
        user_id: userData.user.id
      }).select().single();
      
      if (data && !error) {
        currentId = data.id;
        setDbNoteId(data.id);
        setPanelNoteId(panelId, data.id);
      }
    }

    // Generate historic snapshot if we successfully have an ID
    if (currentId) {
      const { error: versionError } = await supabase.from('note_versions').insert({
        note_id: currentId,
        user_id: userData.user.id,
        content_snapshot: content
      });
      if (versionError) console.error("History Error:", versionError);
    }

    setIsSaving(false);
  };

  const downloadHtml = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setContent(result);
        if (!title && file.name) {
          setTitle(file.name.replace('.md', ''));
        }
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <div className="panel-inner">Loading Note...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px', gap: '8px', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.1)' }}>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }}
        />
        
        <div style={{ display: 'flex', background: 'var(--panel-bg)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
          <button 
            onClick={() => setViewMode('edit')} 
            style={{ padding: '6px 12px', background: viewMode === 'edit' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <Edit3 size={16} />
          </button>
          <button 
            onClick={() => setViewMode('preview')} 
            style={{ padding: '6px 12px', background: viewMode === 'preview' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderLeft: '1px solid var(--panel-border)' }}
          >
            <Eye size={16} />
          </button>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary" 
          style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
        >
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
        </button>

        {dbNoteId && (
           <button 
           onClick={() => setShowHistory(true)}
           title="Version History"
           style={{ background: 'transparent', border: '1px solid var(--panel-border)', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}
         >
           <History size={16} />
         </button>
        )}
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <label title="Import MD" style={{ background: 'transparent', border: '1px solid var(--panel-border)', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <Upload size={16} />
            <input type="file" accept=".md" onChange={importMarkdown} style={{ display: 'none' }} />
          </label>
          <button onClick={downloadHtml} title="Export MD" style={{ background: 'transparent', border: '1px solid var(--panel-border)', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {viewMode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your markdown here... Use [[Title]] to link notes."
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-main)', 
              padding: '16px', 
              fontSize: '1rem', 
              fontFamily: 'monospace', 
              resize: 'none', 
              outline: 'none',
              lineHeight: '1.6'
            }}
          />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <NoteRenderer content={content} />
          </div>
        )}
      </div>

      {showHistory && dbNoteId && (
        <VersionHistoryModal 
          noteId={dbNoteId}
          onClose={() => setShowHistory(false)}
          onRestore={(historicalContent) => {
            setContent(historicalContent);
            // Optionally auto-save upon restore, or just leave it for the user to edit and save manually.
          }}
        />
      )}
    </div>
  );
}

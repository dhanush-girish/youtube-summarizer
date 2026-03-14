'use client';

import React, { useState } from 'react';
import { Youtube, Search, ArrowRight, Loader2, FileDown, LogIn } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/context/WorkspaceContext';
import NoteRenderer from './NoteRenderer'; // Reusing this for safe public rendering

interface YouTubeImporterProps {
  isPublic?: boolean;
}

export default function YouTubeImporter({ isPublic = false }: YouTubeImporterProps) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ title: string; studyMaterial: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  // Pass optional=true so it doesn't crash on the landing page
  const workspace = useWorkspace(true);

  const handleFetch = async () => {
    if (!url) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video data');
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateNote = async () => {
    if (!result) return;
    
    // Save to Database natively
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data, error: dbError } = await supabase.from('notes').insert({
        title: result.title,
        content: result.studyMaterial,
        user_id: userData.user.id
      }).select().single();

      if (!dbError && data) {
         if (workspace?.addPanel) {
           workspace.addPanel('editor', data.id);
         } else if (isPublic) {
            // Logged in user from public page saving it. Redirect to dashboard
            window.location.href = '/dashboard';
         }
      } else {
         alert('Failed to save to database. Check console.');
         console.error(dbError);
      }
    } else {
      if (isPublic) {
        // Trigger Google OAuth Flow for unauthenticated public users
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
          }
        });
      } else {
        alert('You must be signed in to generate notes.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Youtube color="#ef4444" /> YouTube Summarizer
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Paste a YouTube link below to automatically extract its transcript and generate a structured study material note with the video embedded.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--panel-border)', 
              padding: '10px 12px 10px 36px', 
              color: 'var(--text-main)', 
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
        <button 
          className="btn-primary"
          onClick={handleFetch}
          disabled={isProcessing || !url}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          {isProcessing ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {result && (
        isPublic ? (
           <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontWeight: 600 }}>Summary Generated!</div>
                 <button className="btn-primary" onClick={handleGenerateNote} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                    <LogIn size={16} /> Save to Dashboard
                 </button>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                 <NoteRenderer content={result.studyMaterial} />
              </div>
           </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <FileDown size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Transcript & Summary Ready</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Video: <strong>{result.title}</strong>
              </p>
            </div>
            
            <button 
              className="btn-primary"
              onClick={handleGenerateNote}
              style={{ marginTop: '8px', width: '100%' }}
            >
              Generate & Open Study Material
            </button>
          </div>
        )
      )}
    </div>
  );
}

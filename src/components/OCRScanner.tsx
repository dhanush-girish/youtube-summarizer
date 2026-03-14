'use client';

import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { UploadCloud, CheckCircle, Loader2, Copy, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/context/WorkspaceContext';


export default function OCRScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const { addPanel } = useWorkspace();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const imgUrl = URL.createObjectURL(event.target.files[0]);
      setImage(imgUrl);
      setText('');
      setProgress(0);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      setText(result.data.text);
    } catch (err) {
      console.error('OCR Error:', err);
      setText('Failed to extract text. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNote = async () => {
    if (!text) return;
    setIsCreatingNote(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      alert('You must be signed in to create notes.');
      setIsCreatingNote(false);
      return;
    }

    const { data, error } = await supabase.from('notes').insert({
      title: 'OCR Extracted Text',
      content: text,
      user_id: userData.user.id,
    }).select().single();

    if (data && !error) {
      addPanel('editor', data.id);
    } else {
      alert('Failed to create note. Check console.');
      console.error(error);
    }
    setIsCreatingNote(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ScanIcon /> Image to Text (OCR)
      </h2>

      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: '400px' }}>
        {/* Left Column: Upload */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div 
            className="glass-panel" 
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderStyle: 'dashed',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <UploadCloud size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Click to upload an image</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>JPG, PNG, WebP</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
            />
          </div>

          <button 
            className="btn-primary" 
            disabled={!image || isProcessing}
            onClick={processImage}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {isProcessing ? (
              <><Loader2 size={18} className="spin" /> Scanning... {progress}%</>
            ) : (
              <><CheckCircle size={18} /> Extract Text</>
            )}
          </button>
        </div>

        {/* Right Column: Result */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Extracted Text</span>
            {text && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigator.clipboard.writeText(text)} title="Copy to Clipboard" style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                  <Copy size={16} />
                </button>
                <button 
                  onClick={handleCreateNote} 
                  title="Create Note from Text" 
                  disabled={isCreatingNote}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                >
                  <FileText size={16} /> {isCreatingNote ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            )}
          </div>
          <textarea
            value={text}
            readOnly
            placeholder="Text will appear here after extraction..."
            style={{
              flex: 1,
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '16px',
              color: 'var(--text-main)',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.6'
            }}
          />
        </div>
      </div>
    </div>
  );
}

const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>;

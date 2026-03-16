'use client';

import React from 'react';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { FileText, Activity, Share2, ScanText, LogOut, Youtube, BookOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Extracted sidebar so we can use Context hooks inside it
function Sidebar() {
  const { addPanel } = useWorkspace();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside style={{ 
      width: '64px', 
      borderRight: '1px solid var(--panel-border)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      paddingTop: '1rem',
      paddingBottom: '1rem',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        <button className="sidebar-btn" onClick={() => addPanel('notes')} title="Saved Notes">
          <BookOpen size={22} />
        </button>
        <button className="sidebar-btn" onClick={() => addPanel('editor')} title="New Note">
          <FileText size={22} />
        </button>
        <button className="sidebar-btn" onClick={() => addPanel('timeline')} title="Timeline">
          <Activity size={22} />
        </button>
        <button className="sidebar-btn" onClick={() => addPanel('graph')} title="Knowledge Graph">
          <Share2 size={22} />
        </button>
        <button className="sidebar-btn" onClick={() => addPanel('ocr')} title="OCR Scanner">
          <ScanText size={22} />
        </button>
        <button className="sidebar-btn" onClick={() => addPanel('youtube')} title="YouTube Summarizer">
          <Youtube size={22} color="#ef4444" />
        </button>
      </div>
      
      <button className="sidebar-btn" onClick={handleSignOut} title="Sign Out" style={{ color: '#ef4444' }}>
        <LogOut size={22} />
      </button>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
          <WorkspaceLayout />
          {/* We still render children if Next.js needs to mount deeper pages, but our main UI is WorkspaceLayout */}
          <div style={{ display: 'none' }}>{children}</div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}

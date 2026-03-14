import React from 'react';
import AuthButton from '@/components/AuthButton';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to NexusNote
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Connect your thoughts with bidirectional links, visually map your ideas in a dynamic knowledge graph, and capture text seamlessly with AI-powered OCR.
        </p>
        <AuthButton />
      </div>
    </main>
  );
}

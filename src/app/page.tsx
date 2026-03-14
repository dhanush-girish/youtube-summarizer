import React from 'react';
import AuthButton from '@/components/AuthButton';
import YouTubeImporter from '@/components/YouTubeImporter';
import { Network, ScanText, GitPullRequest, History } from 'lucide-react';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
          NexusNote
        </div>
        <div>
           <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '24px', maxWidth: '800px', lineHeight: 1.1, color: 'var(--text-main)' }}>
          Transform YouTube Videos into <br />
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Structured Knowledge.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '600px', lineHeight: 1.6 }}>
          An advanced, zero-cost note-taking environment. Extract text via OCR, link ideas bidirectionally, and visualize your thoughts.
        </p>

        {/* Public Tool Embed */}
        <div style={{ width: '100%', maxWidth: '800px', textAlign: 'left', marginBottom: '80px' }}>
           <div className="glass-panel" style={{ overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
             <YouTubeImporter isPublic={true} />
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--panel-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '64px', color: 'var(--text-main)' }}>Everything you need to think better.</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            
            <FeatureCard 
              icon={<Network size={32} color="var(--accent)" />}
              title="Knowledge Graph"
              description="Visualize the connections between your notes automatically built from your bidirectional links."
            />
            <FeatureCard 
              icon={<GitPullRequest size={32} color="#ec4899" />}
              title="Bidirectional Linking"
              description="Type [[ brackets ]] to instantly link ideas together. Build a web of thoughts seamlessly."
            />
            <FeatureCard 
              icon={<ScanText size={32} color="#3b82f6" />}
              title="AI OCR Text Extraction"
              description="Drag and drop images to instantly extract text locally in your browser. No strings attached."
            />
            <FeatureCard 
              icon={<History size={32} color="#10b981" />}
              title="Infinite Version History"
              description="Every save is snapshot accurately. Travel back in time and restore previous versions of your notes."
            />

          </div>
        </div>
      </section>

    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.3s ease' }}>
      <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
}

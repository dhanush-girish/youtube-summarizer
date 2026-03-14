'use client';

import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { parseBidirectionalLinks } from '@/utils/linkParser';
import { useWorkspace } from '@/context/WorkspaceContext';

interface NoteRendererProps {
  content: string;
}

export default function NoteRenderer({ content }: NoteRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspace = useWorkspace(true);

  // Parse links first
  const { parsedText } = parseBidirectionalLinks(content || '');
  
  // Convert markdown to HTML and sanitize to prevent XSS
  const rawHtml = marked.parse(parsedText, { async: false }) as string;
  const htmlContent = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'data-internal-link'],
  });

  // Hijack clicks on internal links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' && target.dataset.internalLink) {
        e.preventDefault();
        const linkName = target.dataset.internalLink;
        // In this implementation, the linkName is the title of the note.
        // We open a new editor panel. Later we'll make the editor fetch the note by title if noteId isn't given.
        // For now, we simulate opening it by passing the linkName in a special format or relying on search.
        if (workspace?.addPanel) {
          workspace.addPanel('editor', `title:${linkName}`);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleLinkClick);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handleLinkClick);
      }
    };
  }, [workspace]);

  return (
    <div 
      className="markdown-body"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{ padding: '1rem', color: 'var(--text-main)', lineHeight: '1.6' }}
    />
  );
}

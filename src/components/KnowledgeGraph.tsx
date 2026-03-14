'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClient } from '@/utils/supabase/client';
import { useWorkspace } from '@/context/WorkspaceContext';
import { parseBidirectionalLinks } from '@/utils/linkParser';

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const supabase = useMemo(() => createClient(), []);
  const { addPanel } = useWorkspace();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
    async function fetchMap() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content')
        .eq('user_id', userData.user.id);

      if (error || !notes) return;

      const initialNodes: Node[] = [];
      const initialEdges: Edge[] = [];
      const titleToIdMap = new Map<string, string>();

      // First pass: create nodes
      notes.forEach((note) => {
        titleToIdMap.set(note.title, note.id);
        initialNodes.push({
          id: note.id,
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: note.title },
          style: {
            background: 'var(--panel-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: '10px 15px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
          },
        });
      });

      // Second pass: parse links and create edges
      notes.forEach((note) => {
        const { links } = parseBidirectionalLinks(note.content || '');
        const uniqueLinks = Array.from(new Set(links));

        uniqueLinks.forEach((linkedTitle) => {
          let targetId = titleToIdMap.get(linkedTitle);

          // If a note link points to a non-existent note, we create a ghost node
          if (!targetId) {
            targetId = `ghost-${linkedTitle}`;
            if (!initialNodes.find(n => n.id === targetId)) {
               initialNodes.push({
                id: targetId,
                position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
                data: { label: `[Uncreated] ${linkedTitle}` },
                style: {
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--text-muted)',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  opacity: 0.7
                },
              });
            }
          }

          initialEdges.push({
            id: `e-${note.id}-${targetId}`,
            source: note.id,
            target: targetId,
            animated: true,
            style: { stroke: 'var(--accent)', strokeWidth: 2 },
          });
        });
      });

      setNodes(initialNodes);
      setEdges(initialEdges);
    }
    fetchMap();
  }, [supabase]);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('ghost-')) {
       // Open the uncreated note via title format
       const title = node.data.label.replace('[Uncreated] ', '');
       addPanel('editor', `title:${title}`);
    } else {
       addPanel('editor', node.id);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-color)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

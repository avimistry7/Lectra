
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Entity, Relationship } from '../types';

interface KnowledgeGraphProps {
  data: {
    entities: Entity[];
    relationships: Relationship[];
  };
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.entities.length) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto');

    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const links = data.relationships.map(d => ({ ...d }));
    const nodes = data.entities.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Link lines
    const link = g.append('g')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5);

    // Link labels
    const linkLabels = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.relation);

    // Node groups
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node circles
    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => {
        switch (d.type) {
          case 'concept': return '#818cf8';
          case 'person': return '#fb7185';
          case 'theory': return '#34d399';
          case 'method': return '#fbbf24';
          default: return '#cbd5e1';
        }
      });

    // Node labels
    node.append('text')
      .attr('dx', 24)
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text((d: any) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Explicitly return a function that returns nothing (void)
    return () => {
      simulation.stop();
      return undefined;
    };
  }, [data]);

  return (
    <div className="w-full h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner relative">
      <svg ref={svgRef} className="cursor-move w-full h-full" />
      <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg border border-slate-200 text-xs space-y-2 shadow-sm pointer-events-none">
        <div className="font-bold mb-1">Legend</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#818cf8]"></div> Concept</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fb7185]"></div> Person</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#34d399]"></div> Theory</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div> Method</div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;

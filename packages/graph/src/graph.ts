import type {
  KnowledgeEdge,
  KnowledgeGraph,
  KnowledgeNode,
  ParsedDocument,
} from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** In-memory knowledge graph with basic operations. */
export class Graph {
  private nodes = new Map<string, KnowledgeNode>();
  private edges = new Map<string, KnowledgeEdge>();

  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: KnowledgeEdge): void {
    this.edges.set(edge.id, edge);
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): KnowledgeEdge | undefined {
    return this.edges.get(id);
  }

  toSnapshot(): KnowledgeGraph {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }
}

/** Builds a knowledge graph from parsed documents (Phase 1 stub). */
export class GraphBuilder {
  async buildFromDocuments(_documents: ParsedDocument[]): Promise<KnowledgeGraph> {
    throw new NotImplementedError('Graph building from documents');
  }
}

export const graphBuilder = new GraphBuilder();

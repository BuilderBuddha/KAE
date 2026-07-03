import { useState } from 'react';
import type { RepositoryTreeNode } from '../../utils/repository-tree';

interface RepositoryTreeNavProps {
  tree: RepositoryTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  chatGptCount: number;
  showChatGpt: boolean;
  onSelectChatGpt: () => void;
}

function TreeBranch({
  node,
  depth,
  selectedPath,
  onSelect,
  expandedPaths,
  toggleExpanded,
}: {
  node: RepositoryTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedPaths.has(node.path);
  const selected = selectedPath === node.path;

  return (
    <li className="repo-tree__item">
      <div className="repo-tree__row" style={{ paddingLeft: `${8 + depth * 12}px` }}>
        {hasChildren ? (
          <button
            type="button"
            className="repo-tree__toggle"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={() => toggleExpanded(node.path)}
          >
            {expanded ? 'â–¾' : 'â–¸'}
          </button>
        ) : (
          <span className="repo-tree__toggle repo-tree__toggle--spacer" aria-hidden />
        )}
        <button
          type="button"
          className={`repo-tree__link${selected ? ' repo-tree__link--active' : ''}`}
          onClick={() => onSelect(node.path)}
        >
          <span className="repo-tree__label">{node.label}</span>
          <span className="repo-tree__count">{node.fileCount}</span>
        </button>
      </div>
      {hasChildren && expanded ? (
        <ul className="repo-tree__children">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function RepositoryTreeNav({
  tree,
  selectedPath,
  onSelect,
  chatGptCount,
  showChatGpt,
  onSelectChatGpt,
}: RepositoryTreeNavProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(tree.map((n) => n.path)));

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <nav className="repo-tree" aria-label="Repository structure">
      <p className="repo-tree__heading">Repository</p>
      {chatGptCount > 0 ? (
        <button
          type="button"
          className={`repo-tree__special${showChatGpt ? ' repo-tree__special--active' : ''}`}
          onClick={onSelectChatGpt}
        >
          <span>ChatGPT Import</span>
          <span className="repo-tree__count">{chatGptCount}</span>
        </button>
      ) : null}
      <ul className="repo-tree__list">
        {tree.map((node) => (
          <TreeBranch
            key={node.id}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
            expandedPaths={expandedPaths}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </ul>
    </nav>
  );
}

import { useEffect, useRef, useCallback } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GridStack, type GridStackOptions, type GridStackNode, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { useGridStore } from '../store/useGridStore';
import { useUIStore } from '../store/useUIStore';
import WidgetRenderer from './WidgetRenderer';

type ExtendedGridNode = GridStackNode & { type?: string };

export default function GridDashboard() {
  const { gridItems, setGridItems, pendingCommand, clearCommand, selectedWidgetId, selectWidget } = useGridStore();
  const isEditMode = useUIStore((state) => state.isEditMode);
  const gridRef = useRef<GridStack | null>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());

  // Helper to render widget content using React
  const renderWidget = useCallback((node: GridStackNode) => {
    if (!node.el || !node.id) return;

    const contentEl = node.el.querySelector('.grid-stack-item-content');
    if (!contentEl) return;

    // Skip rendering for nested grid containers to avoid wiping the sub-grid
    if (node.subGrid || node.subGridOpts) return;

    // If content is just text string, clear it to mount React component
    if (!rootsRef.current.has(node.id)) {
        contentEl.innerHTML = '';
        
        // Create a container div for React
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        contentEl.appendChild(container);

        const root = createRoot(container);
        // We construct a GridStackWidget object to pass props
        const extendedNode = node as ExtendedGridNode;
        const type = extendedNode.type || node.el?.getAttribute('gs-type') || 'text';
        
        // Persist type back to node if found in DOM but not in node
        if (!extendedNode.type && type) {
            extendedNode.type = type;
        }
        // Also persist to DOM attribute for robustness
        node.el?.setAttribute('gs-type', type);

        const widgetData = {
            ...node,
            type: type, 
        } as GridStackWidget;           
        root.render(<WidgetRenderer item={widgetData} />);
        rootsRef.current.set(node.id, root);
    }
  }, []); // rootsRef is stable

  // Recursive helper for rendering
  const processNodeRender = useCallback((node: GridStackNode) => {
    renderWidget(node);
    if (node.subGrid && node.subGrid.engine.nodes) {
        node.subGrid.engine.nodes.forEach(processNodeRender);
    }
  }, [renderWidget]);

  // Helper for clean up
  const cleanupWidget = useCallback((node: GridStackNode) => {
        if (node.id && rootsRef.current.has(node.id)) {
        const root = rootsRef.current.get(node.id);
        rootsRef.current.delete(node.id);
        setTimeout(() => root?.unmount(), 0);
        }
  }, []);

  const injectDeleteButtons = useCallback((nodes: GridStackNode[]) => {
    nodes.forEach(node => {
        if (node.el) {
        let hasBtn = false;
        for (let i = 0; i < node.el.children.length; i++) {
            if (node.el.children[i].classList.contains('delete-widget-btn')) {
                hasBtn = true;
                break;
            }
        }

        if (!hasBtn) {
            const btn = document.createElement('button');
            btn.className = 'delete-widget-btn';
            btn.innerText = '✕';
            btn.title = 'Remove';
            node.el.appendChild(btn);
        }
        }
        if (node.subGrid && node.subGrid.engine.nodes) {
            injectDeleteButtons(node.subGrid.engine.nodes);
        }
    });
  }, []);

  const syncToStore = useCallback(() => {
    if (gridRef.current) {
        // Capture types from live nodes to ensure persistence
        const typeMap = new Map<string, string>();
        const collectTypes = (nodes: GridStackNode[]) => {
            nodes.forEach(n => {
            const extended = n as ExtendedGridNode;
            if (extended.id && extended.type) {
                typeMap.set(extended.id, extended.type);
            }
            if (n.subGrid && n.subGrid.engine.nodes) {
                collectTypes(n.subGrid.engine.nodes);
            }
            });
        };
        collectTypes(gridRef.current.engine.nodes);

        const layout = gridRef.current.save(false);
        
        // Patch layout with collected types
        const patchLayout = (items: GridStackWidget[]) => {
            items.forEach(item => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extendedItem = item as any;
            if (item.id && typeMap.has(item.id)) {
                extendedItem.type = typeMap.get(item.id);
            }
            if (item.subGridOpts?.children) {
                patchLayout(item.subGridOpts.children);
            }
            });
        };
        patchLayout(layout as GridStackWidget[]);

        setGridItems(layout as GridStackWidget[]);
    }
  }, [setGridItems]);

  // Edit Mode Effect
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.setStatic(!isEditMode);
    }
  }, [isEditMode]);

  // Global Escape Key Listener (Cancel Selection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectWidget(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectWidget]);

  // Selection & Scroll Sync
  useEffect(() => {
    document.querySelectorAll('.highlighted').forEach(el => {
      el.classList.remove('highlighted');
    });

    if (selectedWidgetId) {
      const targetEl = document.querySelector(`.grid-stack-item[gs-id="${selectedWidgetId}"]`);
      if (targetEl) {
        targetEl.classList.add('highlighted');
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [selectedWidgetId]);

  // Initialization
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = GridStack.init({
        cellHeight: 100,
        margin: 5,
        minRow: 1, 
        acceptWidgets: true,
        float: true, 
        subGridOpts: {
          cellHeight: 80,
          margin: 5,
          acceptWidgets: true,
          float: true
        }
      } as GridStackOptions, '.grid-stack-root');

      gridRef.current.load(gridItems);

      // Render initial items recursively
      gridRef.current.engine.nodes.forEach(processNodeRender);
      injectDeleteButtons(gridRef.current.engine.nodes);

      const handleAdded = (_event: Event, items: GridStackNode[]) => {
         const processAddedNode = (node: GridStackNode) => {
           if (!node.id) {
             node.id = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
             if (node.el) {
               node.el.setAttribute('gs-id', node.id);
             }
           }
           renderWidget(node);

           if (node.subGrid && node.subGrid.engine.nodes) {
             node.subGrid.engine.nodes.forEach(processAddedNode);
           }
         };

         items.forEach(processAddedNode);
         injectDeleteButtons(items);
         syncToStore();
      };

      const handleRemoved = (_event: Event, items: GridStackNode[]) => {
        items.forEach(node => {
           cleanupWidget(node);
        });
        syncToStore();
      };

      gridRef.current.on('change', syncToStore);
      gridRef.current.on('added', handleAdded);
      gridRef.current.on('removed', handleRemoved);
    }
    
    // Cleanup on unmount of component
    return () => {
       rootsRef.current.forEach(root => setTimeout(() => root.unmount(), 0));
       rootsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Command Processor
  useEffect(() => {
    if (pendingCommand && gridRef.current) {
      const { type, payload } = pendingCommand;

      if (type === 'MOVE_WIDGET') {
        const { nodeId, targetParentId } = payload;
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);
        if (widgetEl && nodeId) {
          let targetGrid: GridStack | undefined;
          if (!targetParentId) {
            targetGrid = gridRef.current;
          } else {
            const parentEl = document.querySelector(`.grid-stack-item[gs-id="${targetParentId}"]`);
            if (parentEl) {
              const subGridEl = parentEl.querySelector('.grid-stack');
              if (subGridEl && (subGridEl as unknown as { gridstack: GridStack }).gridstack) {
                targetGrid = (subGridEl as unknown as { gridstack: GridStack }).gridstack;
              }
            }
          }

          if (targetGrid) {
            const fullLayout = gridRef.current.save(false) as unknown as GridStackWidget[];
            const findNode = (nodes: GridStackWidget[], id: string): GridStackWidget | null => {
              for (const node of nodes) {
                if (String(node.id) === id) return node;
                if (node.subGridOpts?.children) {
                  const found = findNode(node.subGridOpts.children, id);
                  if (found) return found;
                }
              }
              return null;
            };

            const nodeData = findNode(fullLayout, nodeId);
            if (nodeData) {
              const gridNode = (widgetEl as unknown as { gridstackNode: GridStackNode }).gridstackNode;
              const sourceGrid = gridNode?.grid;
              // Clean up React root before moving (it might be destroyed by DOM manipulation)
              if (rootsRef.current.has(nodeId)) {
                  const root = rootsRef.current.get(nodeId);
                  rootsRef.current.delete(nodeId);
                  setTimeout(() => root?.unmount(), 0);
              }

              if (sourceGrid) {
                sourceGrid.removeWidget(widgetEl as HTMLElement, true); // true = remove DOM (we will re-add)
              }
              const newOptions = {
                ...nodeData,
                x: undefined,
                y: undefined,
                id: String(nodeData.id)
              };
              // Add widget creates new DOM, we will rely on 'added' event to re-mount React
              targetGrid.addWidget(newOptions);
              
              // Force sync
              setTimeout(() => {
                 syncToStore();
              }, 0);
            }
          }
        }
      } 
      else if (type === 'REMOVE_WIDGET') {
        const { nodeId } = payload;
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);
        if (widgetEl) {
           const gridNode = (widgetEl as unknown as { gridstackNode: GridStackNode }).gridstackNode;
           if (gridNode && gridNode.grid) {
             gridNode.grid.removeWidget(widgetEl as HTMLElement);
           }
        }
      }
      else if (type === 'ADD_WIDGET') {
        const { widgetOptions } = payload;
        gridRef.current.addWidget(widgetOptions as GridStackWidget);
      }
      else if (type === 'EXPORT_LAYOUT') {
        const layout = gridRef.current.save(false);
        const json = JSON.stringify(layout, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'grid-layout.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      }
      else if (type === 'LOAD_LAYOUT') {
        const { widgetOptions } = payload;
        // Clean all roots
        rootsRef.current.forEach(root => setTimeout(() => root.unmount(), 0));
        rootsRef.current.clear();
        
        gridRef.current.removeAll();
        gridRef.current.load(widgetOptions as GridStackWidget[]);
        setGridItems(widgetOptions as GridStackWidget[]);
        
        // Render new items recursively
        gridRef.current.engine.nodes.forEach(processNodeRender);
        injectDeleteButtons(gridRef.current.engine.nodes);
      }
      clearCommand();
    }
  }, [pendingCommand, clearCommand, setGridItems, processNodeRender, injectDeleteButtons, syncToStore, cleanupWidget]);

  // Global Click Listener for Delete
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('.delete-widget-btn')) {
        const widgetEl = target.closest('.grid-stack-item');
        if (widgetEl) {
           const id = widgetEl.getAttribute('gs-id');
           if (id) {
             useGridStore.getState().addCommand({ 
               type: 'REMOVE_WIDGET', 
               payload: { nodeId: id } 
             });
           }
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.grid-stack-item')) {
      selectWidget(null);
    }
  };

  return (
    <div 
      className={`grid-stack grid-stack-root ${isEditMode ? 'edit-mode' : ''}`}
      onClick={handleBackgroundClick}
    ></div>
  );
}
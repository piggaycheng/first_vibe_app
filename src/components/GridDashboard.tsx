import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GridStack, type GridStackOptions, type GridStackNode, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { useGridStore } from '../store/useGridStore';
import { useUIStore } from '../store/useUIStore';
import WidgetRenderer from './WidgetRenderer';

export default function GridDashboard() {
  const { gridItems, setGridItems, pendingCommand, clearCommand, selectedWidgetId, selectWidget } = useGridStore();
  const isEditMode = useUIStore((state) => state.isEditMode);
  const gridRef = useRef<GridStack | null>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());

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

      // Helper to render widget content using React
      const renderWidget = (node: GridStackNode) => {
        if (!node.el || !node.id) return;

        let contentEl = node.el.querySelector('.grid-stack-item-content');
        if (!contentEl) return;

        // If content is just text string, clear it to mount React component
        // But check if we already have a root
        if (!rootsRef.current.has(node.id)) {
           // Clear existing HTML content if it's just raw text/HTML from load()
           // Be careful not to wipe out if we are re-rendering? 
           // actually load() puts content in innerHTML.
           // We want to replace it with our React Component.
           contentEl.innerHTML = '';
           
           // Create a container div for React
           const container = document.createElement('div');
           container.style.width = '100%';
           container.style.height = '100%';
           contentEl.appendChild(container);

           const root = createRoot(container);
           // We construct a GridStackWidget object to pass props
           // Note: node is GridStackNode, we might need to extract persistent data
           const type = (node as any).type || node.el?.getAttribute('gs-type') || 'text';
           
           // Persist type back to node if found in DOM but not in node
           if (!(node as any).type && type) {
               (node as any).type = type;
           }

           const widgetData = {
             ...node,
             type: type, 
           } as GridStackWidget;           
           root.render(<WidgetRenderer item={widgetData} />);
           rootsRef.current.set(node.id, root);
        }
      };

      // Helper for clean up
      const cleanupWidget = (node: GridStackNode) => {
         if (node.id && rootsRef.current.has(node.id)) {
            const root = rootsRef.current.get(node.id);
            rootsRef.current.delete(node.id);
            setTimeout(() => root?.unmount(), 0);
         }
      };

      gridRef.current.load(gridItems);

      // Render initial items
      gridRef.current.engine.nodes.forEach(node => {
        renderWidget(node);
        if (node.subGrid && node.subGrid.engine.nodes) {
           node.subGrid.engine.nodes.forEach(sub => renderWidget(sub));
        }
      });

      const injectDeleteButtons = (nodes: GridStackNode[]) => {
        nodes.forEach(node => {
          if (node.el) {
            let hasBtn = false;
            // Check direct children or inside content? usually direct child of item
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
      };

      injectDeleteButtons(gridRef.current.engine.nodes);

      const syncToStore = () => {
        if (gridRef.current) {
          const layout = gridRef.current.save();
          setGridItems(layout as GridStackWidget[]);
        }
      };

      const handleAdded = (_event: Event, items: GridStackNode[]) => {
         items.forEach(node => {
           if (!node.id) {
             node.id = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
             if (node.el) {
               node.el.setAttribute('gs-id', node.id);
             }
           }
           renderWidget(node);
         });
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
       // Optional: We could destroy grid here, but React StrictMode might cause issues 
       // with double init. For now, we trust refs.
       // But we should cleanup roots
       // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const fullLayout = gridRef.current.save() as unknown as GridStackWidget[];
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
                 if (gridRef.current) {
                   const layout = gridRef.current.save();
                   setGridItems(layout as GridStackWidget[]);
                 }
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
        const layout = gridRef.current.save();
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
        
        // Render new items
        gridRef.current.engine.nodes.forEach(node => {
           // We need a way to call renderWidget here, but it's inside useEffect closure.
           // Since we are clearing everything, we can just let the loop handle it
           // But renderWidget is defined in init useEffect... 
           // We might need to refactor renderWidget out or trigger a re-scan.
           // However, grid.load() might not trigger 'added' events for everything?
           // Actually grid.load() DOES NOT trigger 'added' events for initial load.
           // We need to manually render.
           // Since renderWidget is inside the other effect, we can't call it here easily.
           // Quick fix: define renderWidget outside or use a ref to it.
           // Or just replicate logic here since this is a one-off command.
           
           if (!node.el || !node.id) return;
           const contentEl = node.el.querySelector('.grid-stack-item-content');
           if (!contentEl) return;
           contentEl.innerHTML = '';
           const container = document.createElement('div');
           container.style.width = '100%';
           container.style.height = '100%';
           contentEl.appendChild(container);
           const root = createRoot(container);
           const widgetData = { ...node,              type: (node as any).type, };
           root.render(<WidgetRenderer item={widgetData} />);
           rootsRef.current.set(node.id, root);
        });
      }
      clearCommand();
    }
  }, [pendingCommand, clearCommand, setGridItems]);

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
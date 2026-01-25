import { useEffect, useRef } from 'react';
import { GridStack, type GridStackOptions, type GridStackNode, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { useGridStore } from '../store/useGridStore';
import { useUIStore } from '../store/useUIStore';

export default function GridDashboard() {
  const { gridItems, setGridItems, pendingCommand, clearCommand, selectedWidgetId, selectWidget } = useGridStore();
  const isEditMode = useUIStore((state) => state.isEditMode);
  const gridRef = useRef<GridStack | null>(null);

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

      const injectDeleteButtons = (nodes: GridStackNode[]) => {
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
         });
         injectDeleteButtons(items);
         syncToStore();
      };

      gridRef.current.on('change', syncToStore);
      gridRef.current.on('added', handleAdded);
      gridRef.current.on('removed', syncToStore);
      gridRef.current.on('dropped', (_event, _previousWidget, newWidget) => {
        console.log('GridDashboard: Item dropped!', newWidget);
      });
    }
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
              if (sourceGrid) {
                sourceGrid.removeWidget(widgetEl as HTMLElement, true);
              }
              const newOptions = {
                ...nodeData,
                x: undefined,
                y: undefined,
                id: String(nodeData.id)
              };
              targetGrid.addWidget(newOptions);
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
        gridRef.current.removeAll();
        gridRef.current.load(widgetOptions as GridStackWidget[]);
        setGridItems(widgetOptions as GridStackWidget[]);
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
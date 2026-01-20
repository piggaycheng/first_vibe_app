import { useEffect, useRef } from 'react';
import { GridStack, type GridStackOptions, type GridStackNode } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { useGridStore } from '../store/useGridStore';

export default function GridDashboard() {
  const { gridItems, setGridItems, pendingCommand, clearCommand, selectedWidgetId } = useGridStore();
  const gridRef = useRef<GridStack | null>(null);

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
        dragIn: '.new-widget',
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
          if (node.el && !node.el.querySelector('.delete-widget-btn')) {
            const btn = document.createElement('button');
            btn.className = 'delete-widget-btn';
            btn.innerText = '✕';
            btn.title = 'Remove';
            node.el.appendChild(btn);
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
          setGridItems(layout as any);
        }
      };

      const handleAdded = (_event: Event, items: GridStackNode[]) => {
         injectDeleteButtons(items);
         syncToStore();
      };

      gridRef.current.on('change', syncToStore);
      gridRef.current.on('added', handleAdded);
      gridRef.current.on('removed', syncToStore);
    }
  }, []);

  // Command Processor
  useEffect(() => {
    if (pendingCommand && gridRef.current) {
      const { type, payload } = pendingCommand;

      if (type === 'MOVE_WIDGET') {
        const { nodeId, targetParentId } = payload;
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);
        
        if (widgetEl) {
          let targetGrid: GridStack | undefined;
          if (!targetParentId) {
            targetGrid = gridRef.current;
          } else {
            const parentEl = document.querySelector(`.grid-stack-item[gs-id="${targetParentId}"]`);
            if (parentEl) {
              const subGridEl = parentEl.querySelector('.grid-stack');
              if (subGridEl && (subGridEl as any).gridstack) {
                targetGrid = (subGridEl as any).gridstack;
              }
            }
          }

          if (targetGrid) {
            const gridNode = (widgetEl as any).gridstackNode;
            const sourceGrid = gridNode?.grid;
            if (sourceGrid) sourceGrid.removeWidget(widgetEl, false);
            
            widgetEl.removeAttribute('gs-x');
            widgetEl.removeAttribute('gs-y');
            
            targetGrid.el.appendChild(widgetEl);
            targetGrid.makeWidget(widgetEl as HTMLElement);

            setTimeout(() => {
               if (gridRef.current) {
                 const layout = gridRef.current.save();
                 setGridItems(layout as any);
               }
            }, 0);
          }
        }
      } 
      else if (type === 'REMOVE_WIDGET') {
        const { nodeId } = payload;
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);
        if (widgetEl) {
           const gridNode = (widgetEl as any).gridstackNode;
           if (gridNode && gridNode.grid) {
             gridNode.grid.removeWidget(widgetEl);
           }
        }
      }
      else if (type === 'ADD_WIDGET') {
        const { widgetOptions } = payload;
        gridRef.current.addWidget(widgetOptions);
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

      clearCommand();
    }
  }, [pendingCommand, clearCommand]);

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

  return (
    <div className="grid-stack grid-stack-root"></div>
  );
}

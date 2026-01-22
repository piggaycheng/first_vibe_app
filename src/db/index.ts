import Dexie, { type EntityTable } from 'dexie';
import type { GridStackWidget } from 'gridstack';

interface Layout {
  id: string;
  name: string;
  items: GridStackWidget[];
  thumbnail?: Blob;
  updatedAt: Date;
}

interface Page {
  id: string;
  name: string;
  path: string;
  visible: boolean;
  type: 'page' | 'folder';
  gridId?: string;
}

const db = new Dexie('GridDashboardDB') as Dexie & {
  layouts: EntityTable<Layout, 'id'>;
  pages: EntityTable<Page, 'id'>;
};

// Schema declaration:
db.version(1).stores({
  layouts: 'id, name, updatedAt'
});

db.version(2).stores({
  layouts: 'id, name, updatedAt',
  pages: 'id, name, path, visible, gridId'
});

db.version(3).stores({
  layouts: 'id, name, updatedAt',
  pages: 'id, name, path, visible, gridId, type'
});

export type { Layout, Page };
export { db };

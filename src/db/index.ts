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
  gridId?: string;
}

const db = new Dexie('GridDashboardDB') as Dexie & {
  layouts: EntityTable<Layout, 'id'>;
  pages: EntityTable<Page, 'id'>;
};

// Schema declaration:
// 'id' is the primary key
db.version(1).stores({
  layouts: 'id, name, updatedAt'
});

db.version(2).stores({
  layouts: 'id, name, updatedAt',
  pages: 'id, name, path, visible, gridId'
});

export type { Layout, Page };
export { db };

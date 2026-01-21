import Dexie, { type EntityTable } from 'dexie';
import type { GridStackWidget } from 'gridstack';

interface Layout {
  id: string;
  name: string;
  items: GridStackWidget[];
  thumbnail?: Blob;
  updatedAt: Date;
}

const db = new Dexie('GridDashboardDB') as Dexie & {
  layouts: EntityTable<Layout, 'id'>;
};

// Schema declaration:
// 'id' is the primary key
db.version(1).stores({
  layouts: 'id, name, updatedAt'
});

export type { Layout };
export { db };

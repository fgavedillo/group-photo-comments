
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineMessage {
  id: string;
  message: string;
  image?: File;
  timestamp: Date;
  status: 'pending' | 'sent';
}

interface OfflineDB extends DBSchema {
  offlineMessages: {
    key: string;
    value: OfflineMessage;
    indexes: { 'by-status': string };
  };
}

const DB_NAME = 'offlineChat';
const STORE_NAME = 'offlineMessages';

let db: IDBPDatabase<OfflineDB> | null = null;

export const initDB = async () => {
  if (!db) {
    db = await openDB<OfflineDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: false,
        });
        store.createIndex('by-status', 'status');
      },
    });
  }
  return db;
};

export const saveOfflineMessage = async (message: string, image?: File): Promise<string> => {
  const db = await initDB();
  const id = crypto.randomUUID();
  const offlineMessage: OfflineMessage = {
    id,
    message,
    image,
    timestamp: new Date(),
    status: 'pending'
  };
  
  await db.put(STORE_NAME, offlineMessage);
  return id;
};

export const getPendingMessages = async (): Promise<OfflineMessage[]> => {
  const db = await initDB();
  return await db.getAllFromIndex(STORE_NAME, 'by-status', 'pending');
};

export const markMessageAsSent = async (id: string) => {
  const db = await initDB();
  const message = await db.get(STORE_NAME, id);
  if (message) {
    message.status = 'sent';
    await db.put(STORE_NAME, message);
  }
};

import type { SoundroomTrack } from "./types";

const DB_NAME = "soundroom-local-library";
const DB_VERSION = 1;
const TRACK_STORE = "tracks";

export interface StoredLocalTrack {
  id: string;
  track: SoundroomTrack;
  file: Blob;
  artwork?: Blob;
  addedAt: number;
}

function openLocalLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not provide local music storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TRACK_STORE)) {
        db.createObjectStore(TRACK_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("Could not open the local record crate."),
      );
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Local library operation failed."));
  });
}

export async function listStoredLocalTracks(): Promise<StoredLocalTrack[]> {
  const db = await openLocalLibrary();
  try {
    const transaction = db.transaction(TRACK_STORE, "readonly");
    const records = await requestResult(
      transaction.objectStore(TRACK_STORE).getAll() as IDBRequest<
        StoredLocalTrack[]
      >,
    );
    return records.sort((a, b) => b.addedAt - a.addedAt);
  } finally {
    db.close();
  }
}

export async function getStoredLocalTrack(
  id: string,
): Promise<StoredLocalTrack | undefined> {
  const db = await openLocalLibrary();
  try {
    return await requestResult(
      db
        .transaction(TRACK_STORE, "readonly")
        .objectStore(TRACK_STORE)
        .get(id) as IDBRequest<StoredLocalTrack | undefined>,
    );
  } finally {
    db.close();
  }
}

export async function putStoredLocalTracks(
  records: readonly StoredLocalTrack[],
): Promise<void> {
  const db = await openLocalLibrary();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(TRACK_STORE, "readwrite");
      const store = transaction.objectStore(TRACK_STORE);
      for (const record of records) store.put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save local tracks."));
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Saving local tracks was interrupted."),
        );
    });
  } finally {
    db.close();
  }
}

export async function deleteStoredLocalTrack(id: string): Promise<void> {
  const db = await openLocalLibrary();
  try {
    await requestResult(
      db
        .transaction(TRACK_STORE, "readwrite")
        .objectStore(TRACK_STORE)
        .delete(id),
    );
  } finally {
    db.close();
  }
}

import { ref, readonly } from "vue";

const DB_NAME = "banana-server-demos";
const DB_VERSION = 1;
const STORE_NAME = "directory-handles";
const HANDLE_KEY = "cs2-demos-folder";

interface DemoPlayerState {
  isSupported: boolean;
  hasPermission: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
}

// Shared state across all instances
const state = ref<DemoPlayerState>({
  isSupported: false,
  hasPermission: false,
  isDownloading: false,
  downloadProgress: 0,
  error: null,
});

let directoryHandle: FileSystemDirectoryHandle | null = null;

export const useDemoPlayer = () => {
  // Check if File System Access API is supported
  const checkSupport = (): boolean => {
    if (!import.meta.client) return false;
    state.value.isSupported = "showDirectoryPicker" in window;
    return state.value.isSupported;
  };

  // Open IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  };

  // Save directory handle to IndexedDB
  const saveHandle = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, HANDLE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  // Load directory handle from IndexedDB
  const loadHandle =
    async (): Promise<FileSystemDirectoryHandle | null> => {
      try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(HANDLE_KEY);

          request.onerror = () => reject(request.error);
          request.onsuccess = () =>
            resolve(request.result as FileSystemDirectoryHandle | null);
        });
      } catch {
        return null;
      }
    };

  // Clear saved handle
  const clearHandle = async (): Promise<void> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(HANDLE_KEY);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          directoryHandle = null;
          state.value.hasPermission = false;
          resolve();
        };
      });
    } catch {
      directoryHandle = null;
      state.value.hasPermission = false;
    }
  };

  // Verify permission for saved handle
  const verifyPermission = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<boolean> => {
    try {
      // Check if we already have permission
      const options: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
      let permission = await handle.queryPermission(options);

      if (permission === "granted") {
        return true;
      }

      // Request permission if needed
      permission = await handle.requestPermission(options);
      return permission === "granted";
    } catch {
      return false;
    }
  };

  // Initialize - check for saved handle and verify permission
  const initialize = async (): Promise<boolean> => {
    if (!checkSupport()) return false;

    try {
      const savedHandle = await loadHandle();
      if (savedHandle) {
        const hasPermission = await verifyPermission(savedHandle);
        if (hasPermission) {
          directoryHandle = savedHandle;
          state.value.hasPermission = true;
          return true;
        }
      }
    } catch (error) {
      console.warn("Failed to restore demo folder permission:", error);
    }

    state.value.hasPermission = false;
    return false;
  };

  // Prompt user to select demos folder
  const selectDemosFolder = async (): Promise<boolean> => {
    if (!state.value.isSupported) {
      state.value.error = "File System Access API not supported in this browser";
      return false;
    }

    try {
      const handle = await window.showDirectoryPicker({
        id: "cs2-demos",
        mode: "readwrite",
        startIn: "desktop",
      });

      directoryHandle = handle;
      await saveHandle(handle);
      state.value.hasPermission = true;
      state.value.error = null;
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled - not an error
        return false;
      }
      state.value.error = "Failed to select folder";
      console.error("Failed to select demos folder:", error);
      return false;
    }
  };

  // Download demo file to the selected folder
  const downloadDemo = async (
    url: string,
    filename: string,
  ): Promise<boolean> => {
    if (!directoryHandle) {
      state.value.error = "No folder selected";
      return false;
    }

    state.value.isDownloading = true;
    state.value.downloadProgress = 0;
    state.value.error = null;

    try {
      // Fetch the demo file with progress tracking
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const chunks: BlobPart[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          state.value.downloadProgress = Math.round((loaded / total) * 100);
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks);

      // Ensure filename ends with .dem
      const demoFilename = filename.endsWith(".dem")
        ? filename
        : `${filename}.dem`;

      // Write to the selected folder
      const fileHandle = await directoryHandle.getFileHandle(demoFilename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      state.value.downloadProgress = 100;
      return true;
    } catch (error: unknown) {
      console.error("Failed to download demo:", error);
      state.value.error =
        error instanceof Error ? error.message : "Download failed";
      return false;
    } finally {
      state.value.isDownloading = false;
    }
  };

  // Open CS2 with the demo
  const launchDemo = (filename: string): void => {
    const demoName = filename.replace(/\.dem$/, "");
    // Steam protocol to launch CS2 with playdemo command
    window.open(`steam://rungameid/730//+playdemo ${demoName}`, "_self");
  };

  // Full workflow: download and launch
  const watchDemo = async (
    url: string,
    filename: string,
  ): Promise<boolean> => {
    // Check permission first
    if (!state.value.hasPermission) {
      const selected = await selectDemosFolder();
      if (!selected) return false;
    }

    // Download the demo
    const downloaded = await downloadDemo(url, filename);
    if (!downloaded) return false;

    // Launch CS2
    launchDemo(filename);
    return true;
  };

  // Get suggested paths for different platforms
  const getSuggestedPaths = (): { platform: string; path: string }[] => {
    return [
      {
        platform: "Windows",
        path: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\replays",
      },
      {
        platform: "Linux",
        path: "~/.steam/steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/replays",
      },
      {
        platform: "macOS",
        path: "~/Library/Application Support/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/replays",
      },
    ];
  };

  // Initialize on first use
  if (import.meta.client) {
    checkSupport();
  }

  return {
    state: readonly(state),
    isSupported: () => state.value.isSupported,
    hasPermission: () => state.value.hasPermission,
    initialize,
    selectDemosFolder,
    downloadDemo,
    launchDemo,
    watchDemo,
    clearHandle,
    getSuggestedPaths,
  };
};

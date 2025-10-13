// Storage utility for Redux Persist that handles SSR
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Create storage with error handling
let storage: any;

try {
  if (typeof window !== "undefined") {
    storage = createWebStorage("local");
  } else {
    storage = createNoopStorage();
  }
} catch (error) {
  console.warn(
    "Failed to create web storage, falling back to noop storage:",
    error
  );
  storage = createNoopStorage();
}

export default storage;

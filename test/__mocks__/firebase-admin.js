// Mock firebase-admin for tests
const store = new Map();

function doc(id) {
  return {
    id,
    async set(data) { store.set(id, JSON.parse(JSON.stringify(data))); },
    async get() { return { exists: store.has(id), data: () => store.get(id) }; },
    async update(partial) { if (!store.has(id)) throw new Error('missing'); store.set(id, { ...store.get(id), ...partial }); },
    async delete() { store.delete(id); }
  };
}

function collection(name) { // single namespace enough for tests
  return { doc };
}

const firestoreInstance = { collection };

export default {
  apps: [],
  initializeApp() { this.apps.push({}); },
  firestore: () => firestoreInstance,
  firestoreInstance,
};

export const firestore = () => firestoreInstance;

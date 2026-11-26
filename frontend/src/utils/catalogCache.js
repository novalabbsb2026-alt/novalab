import api, { LensService } from '../services/api';

const TTL_MS = 60 * 1000; // 60 segundos de cache em memória por tenant

const store = {
  opticalStores: { data: null, ts: 0, promise: null },
  lensModels: { data: null, ts: 0, promise: null },
  inventoryByModel: new Map(),
};

const isFresh = (entry) => entry && entry.data !== null && (Date.now() - entry.ts) < TTL_MS;

export const invalidateCatalogCache = () => {
  store.opticalStores = { data: null, ts: 0, promise: null };
  store.lensModels = { data: null, ts: 0, promise: null };
  store.inventoryByModel.clear();
};

// Invalida cache automaticamente ao fazer logout ou trocar de laboratório
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', invalidateCatalogCache);
}

export const getCachedOpticalStores = async (force = false) => {
  if (!force && isFresh(store.opticalStores)) {
    return store.opticalStores.data;
  }
  if (!force && store.opticalStores.promise) {
    return store.opticalStores.promise;
  }
  store.opticalStores.promise = api
    .get('/optical-stores/')
    .then((res) => {
      const list = res.data?.items || res.data || [];
      store.opticalStores = { data: list, ts: Date.now(), promise: null };
      return list;
    })
    .catch((err) => {
      store.opticalStores.promise = null;
      throw err;
    });
  return store.opticalStores.promise;
};

export const getCachedLensModels = async (force = false) => {
  if (!force && isFresh(store.lensModels)) {
    return store.lensModels.data;
  }
  if (!force && store.lensModels.promise) {
    return store.lensModels.promise;
  }
  store.lensModels.promise = LensService.getModels()
    .then((res) => {
      const list = res.data?.items || res.data || [];
      store.lensModels = { data: list, ts: Date.now(), promise: null };
      return list;
    })
    .catch((err) => {
      store.lensModels.promise = null;
      throw err;
    });
  return store.lensModels.promise;
};

export const getCachedInventoryGrid = async (lensModelId, force = false) => {
  if (!lensModelId) return [];
  const key = String(lensModelId);
  const existing = store.inventoryByModel.get(key);
  if (!force && isFresh(existing)) {
    return existing.data;
  }
  if (!force && existing?.promise) {
    return existing.promise;
  }
  const promise = api
    .get(`/inventory/grid?lens_model_id=${encodeURIComponent(key)}`)
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      store.inventoryByModel.set(key, { data: list, ts: Date.now(), promise: null });
      return list;
    })
    .catch(() => {
      store.inventoryByModel.delete(key);
      return [];
    });
  store.inventoryByModel.set(key, { data: null, ts: 0, promise });
  return promise;
};

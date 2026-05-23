// ─────────────────────────────────────────────────────────────────────────────
// workOrderStore.js
//
// Lightweight module-level mutable array shared between Clients.jsx and
// WorkOrders.jsx.  No Redux / Context needed — both files import the same
// array reference, so Clients.push() is immediately visible when WorkOrders
// reads it on next render.
//
// WorkOrders uses a subscription pattern: call workOrderStore.subscribe(fn)
// to be notified whenever Clients pushes a new entry.
// ─────────────────────────────────────────────────────────────────────────────

const listeners = new Set();

export const workOrderStore = {
  _data: [],

  /** Called by Clients.jsx when "Send to Client" fires on an Interested row */
  push(wo) {
    this._data = [...this._data, wo];
    listeners.forEach((fn) => fn(this._data));
  },

  /** Returns the current snapshot */
  getAll() {
    return this._data;
  },

  /** WorkOrders.jsx calls this in a useEffect to stay in sync */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn); // returns unsubscribe
  },
};
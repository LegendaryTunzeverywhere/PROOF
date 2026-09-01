/**
 * Embedded JSON store — zero-dependency persistence for the MVP/demo.
 * Written as a thin data-access layer so production can swap to the
 * Prisma + PostgreSQL schema in `prisma/schema.prisma` (see DATABASE.md)
 * without touching service code: everything goes through insert/get/
 * find/all/update/remove and declared unique indexes.
 *
 * Guarantees:
 *  - atomic writes (tmp file + rename)
 *  - serialized write queue (no interleaved mutations)
 *  - unique indexes (e.g. a reward can only exist once per user+source)
 *
 * IMPORTANT LIMITATION (embedded mode only):
 *  - Unique index checks are NOT serialized across concurrent Node.js event loop ticks
 *  - Two simultaneous inserts with the same unique value can both pass validation
 *  - This is acceptable for demo/MVP but requires database-level constraints in production
 *  - Production: Use Prisma + PostgreSQL with proper UNIQUE constraints
 */
import fs from 'node:fs';
import path from 'node:path';

const INDEX_PREFIX = '__idx__';

export class Store {
  /** @param {{dataDir?:string, file?:string}} opts */
  constructor(opts = {}) {
    this.dataDir = path.resolve(process.cwd(), opts.dataDir || 'data');
    this.file = path.join(this.dataDir, opts.file || 'proof.json');
    /** @type {Record<string, Record<string, any>>} */
    this.tables = {};
    /** @type {Map<string, Set<string>>} uniqueIndex:"table:field" -> set of values */
    this.uniques = new Map();
    this.uniqueDefs = new Map(); // table -> [fields]
    this.#queue = Promise.resolve();
  }

  #queue;

  async open(bootstrap) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    if (fs.existsSync(this.file)) {
      try {
        this.tables = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      } catch (e) {
        const backup = this.file + '.corrupt.' + Date.now();
        fs.renameSync(this.file, backup);
        throw new Error(`Store file was corrupt; moved to ${backup}. (${e.message})`);
      }
    } else if (bootstrap) {
      await bootstrap(this);
      await this.#flush();
    }
    return this;
  }

  async reset(bootstrap) {
    this.tables = {};
    this.uniques.clear();
    if (bootstrap) await bootstrap(this);
    await this.#flush();
    return this;
  }

  declareUniques(table, fields) {
    this.uniqueDefs.set(table, fields);
    for (const f of fields) {
      const key = `${table}:${f}`;
      if (!this.uniques.has(key)) {
        const set = new Set();
        for (const row of Object.values(this.tables[table] || {}))
          if (row[f] !== undefined) set.add(String(row[f]));
        this.uniques.set(key, set);
      }
    }
  }

  insert(table, doc) {
    if (!this.tables[table]) this.tables[table] = {};
    const id = doc.id || `_${Object.keys(this.tables[table]).length + 1}`;
    if (this.tables[table][id]) throw new Error(`DUPLICATE_ID ${table}/${id}`);
    for (const f of this.uniqueDefs.get(table) || []) {
      if (doc[f] === undefined) continue;
      const key = `${table}:${f}`;
      const v = String(doc[f]);
      if (this.uniques.get(key)?.has(v))
        throw new Error(`UNIQUE_VIOLATION ${key}=${v}`);
      (this.uniques.get(key) || this.uniques.set(key, new Set()).get(key)).add(v);
    }
    this.tables[table][id] = { ...doc, id };
    return this.tables[table][id];
  }

  get(table, id) { return this.tables[table]?.[id] || null; }

  update(table, id, patch) {
    const row = this.get(table, id);
    if (!row) return null;
    // unique re-checks
    for (const f of this.uniqueDefs.get(table) || []) {
      if (patch[f] === undefined || patch[f] === row[f]) continue;
      const key = `${table}:${f}`, v = String(patch[f]);
      if (this.uniques.get(key)?.has(v)) throw new Error(`UNIQUE_VIOLATION ${key}=${v}`);
      this.uniques.get(key)?.delete(String(row[f]));
      this.uniques.get(key)?.add(v);
    }
    Object.assign(row, patch);
    return row;
  }

  remove(table, id) {
    const row = this.get(table, id);
    if (!row) return false;
    for (const f of this.uniqueDefs.get(table) || [])
      this.uniques.get(`${table}:${f}`)?.delete(String(row[f]));
    delete this.tables[table][id];
    return true;
  }

  all(table) { return Object.values(this.tables[table] || {}); }

  find(table, pred) {
    for (const row of this.all(table)) if (pred(row)) return row;
    return null;
  }

  filter(table, pred) { return this.all(table).filter(pred); }

  count(table, pred) {
    return pred ? this.filter(table, pred).length : this.all(table).length;
  }

  /** Serialized write + atomic flush. Call after mutations (services batch this). */
  save() {
    this.#queue = this.#queue.then(() => this.#flush()).catch(() => {});
    return this.#queue;
  }

  async #flush() {
    const tmp = this.file + '.tmp';
    await fs.promises.writeFile(tmp, JSON.stringify(this.tables));
    await fs.promises.rename(tmp, this.file);
  }
  async flushAndWait() { await this.#flush(); }
}

export const INDEX = INDEX_PREFIX; // reserved

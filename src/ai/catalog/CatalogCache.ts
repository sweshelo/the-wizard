// src/ai/catalog/CatalogCache.ts

/**
 * キャッシュ設定
 */
export interface CacheOptions {
  /** 最大キャッシュサイズ */
  maxSize: number;
  /** TTL (ミリ秒、オプション) */
  ttl?: number;
}

/**
 * LRUキャッシュ実装
 * カタログ情報のキャッシュに使用
 */
export class CatalogCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;
  private readonly ttl?: number;
  private accessOrder: K[];
  private timestamps: Map<K, number>;

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
    this.accessOrder = [];
    this.timestamps = new Map();
  }

  /**
   * 値を取得
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) {
      return undefined;
    }

    // TTLチェック
    if (this.ttl) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttl) {
        this.delete(key);
        return undefined;
      }
    }

    // LRU順序更新
    this.updateAccessOrder(key);
    return value;
  }

  /**
   * 値を設定
   */
  set(key: K, value: V): void {
    // 既存キーの更新
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.timestamps.set(key, Date.now());
      this.updateAccessOrder(key);
      return;
    }

    // 容量オーバー時はLRUを削除
    while (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
        this.timestamps.delete(lruKey);
      }
    }

    // 新規追加
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.accessOrder.push(key);
  }

  /**
   * キーが存在するか確認
   */
  has(key: K): boolean {
    if (!this.cache.has(key)) {
      return false;
    }

    // TTLチェック
    if (this.ttl) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttl) {
        this.delete(key);
        return false;
      }
    }

    return true;
  }

  /**
   * 値を削除
   */
  delete(key: K): boolean {
    const existed = this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return existed;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.accessOrder = [];
  }

  /**
   * 現在のキャッシュサイズ
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * キャッシュに存在すれば返し、なければ計算して格納
   */
  getOrSet(key: K, compute: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = compute();
    this.set(key, value);
    return value;
  }

  /**
   * LRU順序を更新
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}

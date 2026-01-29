// src/ai/knowledge/KnowledgeStore.ts

/**
 * 知識エントリのタイプ
 */
export type KnowledgeType =
  | 'combo'
  | 'strategy'
  | 'opponent_pattern'
  | 'card_synergy'
  | 'game_insight';

/**
 * 知識エントリ
 */
export interface KnowledgeEntry {
  id: string;
  type: KnowledgeType;
  content: string;
  importance: number; // 0-1
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  accessCount?: number;
  relatedIds?: string[];
}

/**
 * 検索クエリ
 */
export interface SearchQuery {
  type?: KnowledgeType;
  tag?: string;
  minImportance?: number;
  limit?: number;
}

/**
 * ストア統計
 */
export interface StoreStats {
  totalEntries: number;
  byType: Record<string, number>;
  averageImportance: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

/**
 * 知識ストレージクラス
 * 学習した知識を永続化する（メモリ版、LocalStorage対応可能）
 */
export class KnowledgeStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private idCounter: number = 0;
  private static readonly STORAGE_KEY = 'ai_knowledge_store';

  constructor() {
    // LocalStorageから復元を試みる
    this.loadFromStorage();
  }

  /**
   * 知識エントリを保存
   */
  save(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeEntry {
    const id = this.generateId();
    const now = new Date();

    const fullEntry: KnowledgeEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    };

    this.entries.set(id, fullEntry);
    this.saveToStorage();

    return fullEntry;
  }

  /**
   * IDで取得
   */
  get(id: string): KnowledgeEntry | undefined {
    const entry = this.entries.get(id);
    if (entry) {
      entry.accessCount = (entry.accessCount || 0) + 1;
    }
    return entry;
  }

  /**
   * 検索
   */
  search(query: SearchQuery): KnowledgeEntry[] {
    let results = Array.from(this.entries.values());

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.tag) {
      const tag = query.tag;
      results = results.filter(e => e.tags.includes(tag));
    }

    if (query.minImportance !== undefined) {
      const minImportance = query.minImportance;
      results = results.filter(e => e.importance >= minImportance);
    }

    // 重要度でソート
    results.sort((a, b) => b.importance - a.importance);

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * 更新
   */
  update(
    id: string,
    updates: Partial<Omit<KnowledgeEntry, 'id' | 'createdAt'>>
  ): KnowledgeEntry | undefined {
    const entry = this.entries.get(id);
    if (!entry) {
      return undefined;
    }

    const updated: KnowledgeEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
    };

    this.entries.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * 削除
   */
  delete(id: string): boolean {
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 重要度順に取得
   */
  getByImportance(limit: number): KnowledgeEntry[] {
    return this.search({ limit });
  }

  /**
   * 古いエントリを削除
   */
  pruneOld(daysOld: number): number {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let pruned = 0;

    for (const [id, entry] of this.entries) {
      if (entry.createdAt < cutoff) {
        this.entries.delete(id);
        pruned++;
      }
    }

    if (pruned > 0) {
      this.saveToStorage();
    }

    return pruned;
  }

  /**
   * クリア
   */
  clear(): void {
    this.entries.clear();
    this.saveToStorage();
  }

  /**
   * 統計を取得
   */
  getStats(): StoreStats {
    const entries = Array.from(this.entries.values());

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        byType: {},
        averageImportance: 0,
      };
    }

    const byType: Record<string, number> = {};
    let totalImportance = 0;
    let oldest: Date | undefined;
    let newest: Date | undefined;

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      totalImportance += entry.importance;

      if (!oldest || entry.createdAt < oldest) {
        oldest = entry.createdAt;
      }
      if (!newest || entry.createdAt > newest) {
        newest = entry.createdAt;
      }
    }

    return {
      totalEntries: entries.length,
      byType,
      averageImportance: totalImportance / entries.length,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * 関連エントリを取得
   */
  getRelated(id: string): KnowledgeEntry[] {
    const entry = this.entries.get(id);
    if (!entry || !entry.relatedIds) {
      return [];
    }

    return entry.relatedIds
      .map(relId => this.entries.get(relId))
      .filter((e): e is KnowledgeEntry => e !== undefined);
  }

  /**
   * タグでグループ化
   */
  groupByTag(): Map<string, KnowledgeEntry[]> {
    const groups = new Map<string, KnowledgeEntry[]>();

    for (const entry of this.entries.values()) {
      for (const tag of entry.tags) {
        if (!groups.has(tag)) {
          groups.set(tag, []);
        }
        const group = groups.get(tag);
        if (group) {
          group.push(entry);
        }
      }
    }

    return groups;
  }

  /**
   * LocalStorageに保存
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const data = Array.from(this.entries.entries()).map(([_id, entry]) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }));
      window.localStorage.setItem(KnowledgeStore.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ストレージエラーは無視
    }
  }

  /**
   * LocalStorageから読み込み
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(KnowledgeStore.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Array<{
          id: string;
          type: KnowledgeType;
          content: string;
          importance: number;
          tags: string[];
          createdAt: string;
          updatedAt: string;
          accessCount?: number;
          relatedIds?: string[];
        }>;

        for (const item of data) {
          this.entries.set(item.id, {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          });
        }
      }
    } catch {
      // パースエラーは無視
    }
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `knowledge-${Date.now()}-${this.idCounter}`;
  }
}

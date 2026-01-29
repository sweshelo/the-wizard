import type { IAtom, ICard } from '@/submodule/suit/types';

/**
 * IAtomがICardかどうかを判定する型ガード
 * catalogIdとlvプロパティの存在と型をチェック
 */
export function isICard(atom: IAtom): atom is ICard {
  return (
    'catalogId' in atom &&
    typeof atom.catalogId === 'string' &&
    'lv' in atom &&
    typeof atom.lv === 'number'
  );
}

/**
 * unknown値がICard配列かどうかを判定する型ガード
 */
export function isICardArray(value: unknown): value is ICard[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'catalogId' in item &&
        typeof (item as Record<string, unknown>).catalogId === 'string' &&
        'lv' in item &&
        typeof (item as Record<string, unknown>).lv === 'number'
    )
  );
}

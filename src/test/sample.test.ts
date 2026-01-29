// src/test/sample.test.ts
import { describe, it, expect } from 'bun:test';

describe('テスト環境', () => {
  it('Bun Test が動作すること', () => {
    expect(1 + 1).toBe(2);
  });

  it('DOM環境が利用可能なこと', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    expect(div.textContent).toBe('Hello');
  });

  it('DOM属性が設定できること', () => {
    const element = document.createElement('button');
    element.setAttribute('data-testid', 'test-button');
    expect(element.getAttribute('data-testid')).toBe('test-button');
  });
});

// src/ai/mcp/types.ts

/**
 * JSON Schema型定義
 */
export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchemaProperty;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
}

/**
 * MCPツール定義
 */
export interface MCPTool {
  /** ツール名 */
  name: string;
  /** ツールの説明 */
  description: string;
  /** パラメータスキーマ */
  parameters: JSONSchema;
  /** ツール実行関数 */
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * ツール実行結果
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * LLM向けツール定義（簡略化）
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

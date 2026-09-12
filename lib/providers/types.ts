export type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: any } | { type: 'document'; source: any };
export type NormalizedResult = {
  text: string; json: any; sources: { url: string; title: string }[];
  tools: { tool: string; input: any }[]; images: string[]; toolResults: string[];
  events: { who: string; text: string; kind: string }[]; ms: number; provider: string; model: string; usage?: any;
};
export type ModelCall = {
  system: string; content: ContentBlock[]; maxTokens?: number;
  webSearch?: boolean; mcpServers?: { type: 'url'; url: string; name: string; authorization_token?: string }[];
};
export interface ModelProvider { id: string; available(): boolean; call(c: ModelCall): Promise<NormalizedResult>; }
export function extractJSON(text: string) {
  if (!text) return null; const t = text.replace(/```json|```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b < 0) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { try { return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch { return null; } }
}

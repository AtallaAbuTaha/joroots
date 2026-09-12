export type ConnectorStatus = 'CONNECTED' | 'NOT_CONNECTED' | 'MISSING_CREDENTIALS' | 'ERROR' | 'DISABLED';
export type Connector = {
  id: string; name: string; provider: string; category: string; auth_type: string; kind: 'model' | 'tool' | 'mcp' | 'api' | 'storage';
  required_env: string[]; available_actions: string[]; assigned_agents: string[]; mcp_url?: string; notes?: string;
};
export const CONNECTORS: Connector[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', provider: 'anthropic', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['ANTHROPIC_API_KEY'], available_actions: ['reasoning', 'writing', 'web_search', 'mcp_tools'], assigned_agents: ['orchestrator', 'research', 'marketing-strategist', 'content-creative'], notes: 'The only provider that can carry MCP connector tools (Higgsfield, Canva, Gmail, Slack, Drive). Paid.' },
  { id: 'openai', name: 'OpenAI', provider: 'openai', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['OPENAI_API_KEY'], available_actions: ['reasoning', 'writing'], assigned_agents: [], notes: 'Paid fallback.' },
  { id: 'groq', name: 'Groq (free tier)', provider: 'groq', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['GROQ_API_KEY'], available_actions: ['reasoning', 'writing', 'json mode'], assigned_agents: ['orchestrator', 'research', 'marketing-strategist', 'content-creative'], notes: 'Free, no card, does not train on your inputs. Default model openai/gpt-oss-120b. Limit is throughput (~30 req/min), not quality. Key: console.groq.com' },
  { id: 'gemini', name: 'Google Gemini', provider: 'gemini', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['GEMINI_API_KEY'], available_actions: ['reasoning', 'writing', 'json mode', 'vision'], assigned_agents: [], notes: 'Free tier trains on your inputs and is barred for EU/UK production — enable billing for confidential work (Flash-Lite costs cents). Key: aistudio.google.com' },
  { id: 'openrouter', name: 'OpenRouter (free models)', provider: 'openrouter', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['OPENROUTER_API_KEY'], available_actions: ['reasoning', 'writing'], assigned_agents: [], notes: 'Breadth fallback. Free routes may train on inputs unless you disable training providers in account settings. 20 req/min, 50/day at zero balance.' },
  { id: 'mistral', name: 'Mistral', provider: 'mistral', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['MISTRAL_API_KEY'], available_actions: ['reasoning', 'writing', 'json mode'], assigned_agents: [], notes: 'EU hosting, free zero-retention option. Free tier is for evaluation; production needs their paid tier.' },
  { id: 'deepseek', name: 'DeepSeek', provider: 'deepseek', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['DEEPSEEK_API_KEY'], available_actions: ['reasoning', 'writing', 'json mode'], assigned_agents: [], notes: 'Cheap, not free. Data is processed in China — check before sending client-confidential material.' },
  { id: 'tavily', name: 'Tavily web search', provider: 'tavily', category: 'research', kind: 'api', auth_type: 'api_key', required_env: ['TAVILY_API_KEY'], available_actions: ['search', 'cite'], assigned_agents: ['research'], notes: '1,000 free searches/month, no card. Used whenever the serving model is not Anthropic. Key: tavily.com' },
  { id: 'web_search', name: 'Web search (Anthropic native)', provider: 'anthropic', category: 'research', kind: 'tool', auth_type: 'inherits', required_env: ['ANTHROPIC_API_KEY'], available_actions: ['search', 'cite'], assigned_agents: ['research'] },
  { id: 'knowledge', name: 'Joroots knowledge base', provider: 'local', category: 'knowledge', kind: 'tool', auth_type: 'none', required_env: [], available_actions: ['retrieve'], assigned_agents: ['orchestrator', 'research', 'marketing-strategist', 'content-creative'] },
  { id: 'kv', name: 'Project memory (Upstash / Vercel KV)', provider: 'upstash', category: 'storage', kind: 'storage', auth_type: 'api_key', required_env: ['KV_REST_API_URL', 'KV_REST_API_TOKEN'], available_actions: ['save', 'load', 'list'], assigned_agents: ['orchestrator'], notes: 'Without it the app runs in-memory: projects are lost on redeploy.' },
  { id: 'higgsfield', name: 'Higgsfield (image generation)', provider: 'higgsfield', category: 'creative', kind: 'api', auth_type: 'key_and_secret', required_env: ['HIGGSFIELD_API_KEY_ID', 'HIGGSFIELD_API_KEY_SECRET'], available_actions: ['generate_image', 'poll_status'], assigned_agents: ['content-creative'], notes: 'Direct REST API (api.higgsfield.ai) — works on its own, no Anthropic key needed. Create a key ID and secret at cloud.higgsfield.ai.' },
  { id: 'canva', name: 'Canva', provider: 'canva', category: 'creative', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['CANVA_MCP_TOKEN'], mcp_url: 'https://mcp.canva.com/mcp', available_actions: ['create_design', 'edit_design', 'export_design'], assigned_agents: ['content-creative'] },
  { id: 'figma', name: 'Figma', provider: 'figma', category: 'creative', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['FIGMA_MCP_TOKEN'], mcp_url: 'https://mcp.figma.com/mcp', available_actions: ['create_file', 'generate_design', 'export'], assigned_agents: [] },
  { id: 'slack', name: 'Slack', provider: 'slack', category: 'communication', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['SLACK_MCP_TOKEN'], mcp_url: 'https://mcp.slack.com/mcp', available_actions: ['post_message', 'read_channels'], assigned_agents: ['orchestrator'] },
  { id: 'gmail', name: 'Gmail', provider: 'google', category: 'communication', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['GMAIL_MCP_TOKEN'], mcp_url: 'https://gmailmcp.googleapis.com/mcp/v1', available_actions: ['create_draft', 'send', 'search_threads', 'reply'], assigned_agents: ['orchestrator'], notes: 'Drafts by default. Sending requires an explicit user instruction.' },
  { id: 'gdrive', name: 'Google Drive', provider: 'google', category: 'files', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['GDRIVE_MCP_TOKEN'], mcp_url: 'https://drivemcp.googleapis.com/mcp/v1', available_actions: ['search_files', 'read_file', 'create_file'], assigned_agents: ['research', 'orchestrator'] },
  { id: 'vercel', name: 'Vercel', provider: 'vercel', category: 'devops', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['VERCEL_MCP_TOKEN'], mcp_url: 'https://mcp.vercel.com', available_actions: ['list_projects', 'deploy', 'logs'], assigned_agents: [] },
  { id: 'github', name: 'GitHub', provider: 'github', category: 'devops', kind: 'api', auth_type: 'token', required_env: ['GITHUB_TOKEN', 'GITHUB_REPO'], available_actions: ['read_repo', 'create_commit', 'open_issue'], assigned_agents: [] },
];
export function connectorStatus(c: Connector): { status: ConnectorStatus; missing: string[] } {
  const missing = c.required_env.filter(k => !process.env[k]);
  if (!c.required_env.length) return { status: 'CONNECTED', missing: [] };
  return { status: missing.length ? 'MISSING_CREDENTIALS' : 'CONNECTED', missing };
}
export const getConnector = (id: string) => CONNECTORS.find(c => c.id === id);
export const isConnected = (id: string) => { const c = getConnector(id); return !!c && connectorStatus(c).status === 'CONNECTED'; };
export function mcpServersFor(ids: string[], keys?: Record<string, string>) {
  return ids.map(getConnector).filter(c => c && c.kind === 'mcp' && (keys?.[c.required_env[0]] || connectorStatus(c).status === 'CONNECTED'))
    .map(c => ({ type: 'url' as const, url: c!.mcp_url!, name: c!.id + '-mcp', authorization_token: keys?.[c!.required_env[0]] || process.env[c!.required_env[0]] }));
}
export function isConnectedWith(id: string, keys?: Record<string, string>) {
  const c = getConnector(id); if (!c) return false;
  if (keys && c.required_env.length && c.required_env.every(k => keys[k] || process.env[k])) return true;
  return connectorStatus(c).status === 'CONNECTED';
}
export const registryView = () => CONNECTORS.map(c => ({ ...c, ...connectorStatus(c) }));

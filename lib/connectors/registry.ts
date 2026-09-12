export type ConnectorStatus = 'CONNECTED' | 'NOT_CONNECTED' | 'MISSING_CREDENTIALS' | 'ERROR' | 'DISABLED';
export type Connector = {
  id: string; name: string; provider: string; category: string; auth_type: string; kind: 'model' | 'tool' | 'mcp' | 'api' | 'storage';
  required_env: string[]; available_actions: string[]; assigned_agents: string[]; mcp_url?: string; notes?: string;
};
export const CONNECTORS: Connector[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', provider: 'anthropic', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['ANTHROPIC_API_KEY'], available_actions: ['reasoning', 'writing', 'web_search', 'mcp_tools'], assigned_agents: ['orchestrator', 'research', 'marketing-strategist', 'content-creative'] },
  { id: 'openai', name: 'OpenAI', provider: 'openai', category: 'model', kind: 'model', auth_type: 'api_key', required_env: ['OPENAI_API_KEY'], available_actions: ['reasoning', 'writing'], assigned_agents: [], notes: 'Fallback provider. Text only.' },
  { id: 'web_search', name: 'Web search', provider: 'anthropic', category: 'research', kind: 'tool', auth_type: 'inherits', required_env: ['ANTHROPIC_API_KEY'], available_actions: ['search', 'cite'], assigned_agents: ['research'] },
  { id: 'knowledge', name: 'Joroots knowledge base', provider: 'local', category: 'knowledge', kind: 'tool', auth_type: 'none', required_env: [], available_actions: ['retrieve'], assigned_agents: ['orchestrator', 'research', 'marketing-strategist', 'content-creative'] },
  { id: 'kv', name: 'Project memory (Upstash / Vercel KV)', provider: 'upstash', category: 'storage', kind: 'storage', auth_type: 'api_key', required_env: ['KV_REST_API_URL', 'KV_REST_API_TOKEN'], available_actions: ['save', 'load', 'list'], assigned_agents: ['orchestrator'], notes: 'Without it the app runs in-memory: projects are lost on redeploy.' },
  { id: 'higgsfield', name: 'Higgsfield (image / video)', provider: 'higgsfield', category: 'creative', kind: 'mcp', auth_type: 'oauth_bearer', required_env: ['HIGGSFIELD_MCP_TOKEN'], mcp_url: 'https://mcp.higgsfield.ai/mcp', available_actions: ['generate_image', 'generate_video', 'jobs_wait', 'upscale'], assigned_agents: ['content-creative'] },
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
export function mcpServersFor(ids: string[]) {
  return ids.map(getConnector).filter(c => c && c.kind === 'mcp' && connectorStatus(c).status === 'CONNECTED')
    .map(c => ({ type: 'url' as const, url: c!.mcp_url!, name: c!.id + '-mcp', authorization_token: process.env[c!.required_env[0]] }));
}
export const registryView = () => CONNECTORS.map(c => ({ ...c, ...connectorStatus(c) }));

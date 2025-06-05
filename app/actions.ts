'use server'

export interface SmitheryServer {
  qualifiedName: string;
  displayName: string;
  description: string;
  homepage: string;
  useCount: string;
  isDeployed: boolean;
  createdAt: string;
}

export interface SmitheryResponse {
  servers: SmitheryServer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}
const authToken = process.env.SMITHERY_AUTH_TOKEN;

export async function getServers(): Promise<SmitheryResponse> {
  if (!authToken) {
    throw new Error('SMITHERY_API_KEY is not set in environment variables');
  }
  const response = await fetch('https://registry.smithery.ai/servers?pageSize=25', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(response);
    throw new Error(`Failed to fetch servers: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export interface JSONSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}


export interface BaseServerConnection {
  configSchema: Record<string, any>;
  exampleSchema: Record<string, any>;
}

export type ServerConnection = {
  type: 'stdio',
  /**
   * stdio function
   * for example: `"config => ({ command: 'npx', args: ['-y', '@wonderwhy-er/desktop-commander@latest'] })"`
   */
  stdioFunction: string;
} & BaseServerConnection | {
  type: 'http',
  deploymentUrl: string;
  configSchema: JSONSchema;
} & BaseServerConnection


export interface ServerDetails {
  qualifiedName: string;
  displayName: string;
  iconUrl: string | null;
  deploymentUrl: string;
  connections: ServerConnection[];
  security: {
    scanPassed: boolean;
  } | null;
  tools: Array<{
    name: string;
    description: string | null;
    inputSchema: {
      type: "object";
      properties?: object;
    };
  }> | null;
}

export async function getServerDetails(qualifiedName: string): Promise<ServerDetails> {
  if (!authToken) {
    throw new Error('SMITHERY_AUTH_TOKEN is not set in environment variables');
  }
  const response = await fetch(`https://registry.smithery.ai/servers/${qualifiedName}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(response);
    throw new Error(`Failed to fetch server details: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
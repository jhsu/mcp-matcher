"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getServers,
  getServerDetails,
  type SmitheryServer,
  type ServerDetails,
  ServerConnection,
} from "../actions";

interface ServerMatchProps {
  authToken: string;
}

export default function ServerMatch({ authToken }: ServerMatchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<SmitheryServer[]>([]);
  const [selectedServers, setSelectedServers] = useState<{
    server1: ServerDetails | null;
    server2: ServerDetails | null;
  }>({ server1: null, server2: null });
  const [selectedConnections, setSelectedConnections] = useState<{
    server1: number;
    server2: number;
  }>({ server1: 0, server2: 0 });
  const [combinedConfig, setCombinedConfig] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchServersAndMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get list of servers
      const serversResponse = await getServers();
      setServers(serversResponse.servers);

      // Pick two random servers
      const shuffled = [...serversResponse.servers].sort(
        () => 0.5 - Math.random()
      );
      const randomServers = shuffled.slice(0, 2);

      if (randomServers.length < 2) {
        throw new Error("Not enough servers available");
      }

      // Get details for both servers
      const [server1Details, server2Details] = await Promise.all([
        getServerDetails(randomServers[0].qualifiedName, authToken),
        getServerDetails(randomServers[1].qualifiedName, authToken),
      ]);

      setSelectedServers({ server1: server1Details, server2: server2Details });
      setSelectedConnections({ server1: 0, server2: 0 });

      // Update URL with selected servers
      const params = new URLSearchParams();
      params.set("server1", server1Details.qualifiedName);
      params.set("server2", server2Details.qualifiedName);
      params.set("conn1", "0");
      params.set("conn2", "0");
      router.push(`?${params.toString()}`, { scroll: false });

      // Create combined configuration with first connection of each server
      updateCombinedConfig(server1Details, server2Details, 0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateServerConfig = (
    server: ServerDetails,
    connection: ServerConnection
  ) => {
    const schema = connection.configSchema || {};
    const serverConfig: any = {};

    if (connection.type === "stdio") {
      // Parse the stdioFunction to extract command and args
      const stdioFunction = connection.stdioFunction;

      try {
        // Extract command and args from the function string
        // Example: "config => ({ command: 'npx', args: ['-y', '@wonderwhy-er/desktop-commander@latest'] })"
        const match = stdioFunction.match(
          /command:\s*['"]([^'"]+)['"].*args:\s*\[([^\]]+)\]/
        );

        if (match) {
          serverConfig.command = match[1];
          // Parse args array, handling quoted strings
          const argsString = match[2];
          const args = argsString
            .split(",")
            .map((arg) => arg.trim().replace(/^['"]|['"]$/g, ""));
          serverConfig.args = args;
        } else {
          // Fallback if parsing fails
          serverConfig.command = "npx";
          serverConfig.args = ["-y", server.qualifiedName];
        }
      } catch {
        // Fallback if parsing fails
        serverConfig.command = "npx";
        serverConfig.args = ["-y", server.qualifiedName];
      }
    } else if (connection.type === "http") {
      // For HTTP connections, use the deploymentUrl
      serverConfig.url = connection.deploymentUrl;
    }

    // Add environment variables from schema
    if (schema.properties) {
      serverConfig.env = generateSampleConfig(schema);
    }

    // For HTTP connections, always add API_KEY for Smithery authentication
    if (connection.type === "http") {
      if (!serverConfig.env) {
        serverConfig.env = {};
      }
      serverConfig.env.API_KEY = "<your-smithery-api-key>";
    }

    return serverConfig;
  };

  const updateCombinedConfig = (
    server1: ServerDetails,
    server2: ServerDetails,
    connection1Index: number,
    connection2Index: number
  ) => {
    const connection1 = server1.connections[connection1Index];
    const connection2 = server2.connections[connection2Index];

    const combined = {
      mcpServers: {
        [server1.qualifiedName]: generateServerConfig(server1, connection1),
        [server2.qualifiedName]: generateServerConfig(server2, connection2),
      },
    };

    setCombinedConfig(combined);
  };

  const handleConnectionChange = (
    serverKey: "server1" | "server2",
    connectionIndex: number
  ) => {
    const newConnections = {
      ...selectedConnections,
      [serverKey]: connectionIndex,
    };
    setSelectedConnections(newConnections);

    // Update URL with new connection selection
    const params = new URLSearchParams(searchParams);
    if (serverKey === "server1") {
      params.set("conn1", connectionIndex.toString());
    } else {
      params.set("conn2", connectionIndex.toString());
    }
    router.push(`?${params.toString()}`, { scroll: false });

    if (selectedServers.server1 && selectedServers.server2) {
      updateCombinedConfig(
        selectedServers.server1,
        selectedServers.server2,
        serverKey === "server1" ? connectionIndex : selectedConnections.server1,
        serverKey === "server2" ? connectionIndex : selectedConnections.server2
      );
    }
  };

  const convertToEnvVarName = (key: string): string => {
    // Convert camelCase to SCREAMING_SNAKE_CASE
    return key
      .replace(/([a-z])([A-Z])/g, "$1_$2") // Insert underscore between lowercase and uppercase
      .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2") // Handle consecutive uppercase letters
      .toUpperCase();
  };

  const generateSampleConfig = (schema: any): object => {
    if (!schema.properties) return {};

    const config: any = {};
    for (const [key, prop] of Object.entries(
      schema.properties as Record<string, any>
    )) {
      const envKey = convertToEnvVarName(key);

      if (prop.type === "string") {
        config[envKey] = prop.default || `<${key}>`;
      } else if (prop.type === "number") {
        config[envKey] = prop.default || 0;
      } else if (prop.type === "boolean") {
        config[envKey] = prop.default || false;
      } else if (prop.type === "array") {
        config[envKey] = prop.default || [];
      } else if (prop.type === "object") {
        config[envKey] = prop.default || {};
      }
    }
    return config;
  };

  // Load match from URL params on page load
  useEffect(() => {
    const server1Name = searchParams.get("server1");
    const server2Name = searchParams.get("server2");
    const conn1 = searchParams.get("conn1");
    const conn2 = searchParams.get("conn2");

    if (server1Name && server2Name) {
      loadMatchFromParams(server1Name, server2Name, conn1, conn2);
    }
  }, [authToken]);

  const loadMatchFromParams = async (
    server1Name: string,
    server2Name: string,
    conn1: string | null,
    conn2: string | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Get details for both servers
      const [server1Details, server2Details] = await Promise.all([
        getServerDetails(server1Name, authToken),
        getServerDetails(server2Name, authToken),
      ]);

      const connection1Index = conn1 ? parseInt(conn1) : 0;
      const connection2Index = conn2 ? parseInt(conn2) : 0;

      setSelectedServers({ server1: server1Details, server2: server2Details });
      setSelectedConnections({
        server1: Math.min(
          connection1Index,
          server1Details.connections.length - 1
        ),
        server2: Math.min(
          connection2Index,
          server2Details.connections.length - 1
        ),
      });

      // Create combined configuration
      updateCombinedConfig(
        server1Details,
        server2Details,
        Math.min(connection1Index, server1Details.connections.length - 1),
        Math.min(connection2Index, server2Details.connections.length - 1)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load servers from URL"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!combinedConfig) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(combinedConfig, null, 2)
      );
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          MCP Server Match
        </h1>
        <button
          onClick={fetchServersAndMatch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Random Server Match"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {selectedServers.server1 && selectedServers.server2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Server 1 */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              {selectedServers.server1.iconUrl && (
                <img
                  src={selectedServers.server1.iconUrl}
                  alt={selectedServers.server1.displayName}
                  className="w-8 h-8 mr-3"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedServers.server1.displayName}
              </h2>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-gray-900">Qualified Name:</strong>{" "}
              {selectedServers.server1.qualifiedName}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong className="text-gray-900">Deployment URL:</strong>{" "}
              {selectedServers.server1.deploymentUrl}
            </p>

            {selectedServers.server1.tools &&
              selectedServers.server1.tools.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-900">
                    Tools ({selectedServers.server1.tools.length}):
                  </h3>
                  <div className="space-y-1">
                    {selectedServers.server1.tools
                      .slice(0, 3)
                      .map((tool, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-mono text-blue-600">
                            {tool.name}
                          </span>
                          {tool.description && (
                            <span className="text-gray-700 ml-2">
                              {tool.description}
                            </span>
                          )}
                        </div>
                      ))}
                    {selectedServers.server1.tools.length > 3 && (
                      <div className="text-sm text-gray-600">
                        +{selectedServers.server1.tools.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

            {selectedServers.server1.connections.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Connection Type:
                </h3>
                {selectedServers.server1.connections.length > 1 ? (
                  <div className="flex gap-2">
                    {selectedServers.server1.connections.map((conn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleConnectionChange("server1", idx)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          selectedConnections.server1 === idx
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {conn.type}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="inline-block px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium">
                    {selectedServers.server1.connections[0].type}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Server 2 */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              {selectedServers.server2.iconUrl && (
                <img
                  src={selectedServers.server2.iconUrl}
                  alt={selectedServers.server2.displayName}
                  className="w-8 h-8 mr-3"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedServers.server2.displayName}
              </h2>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-gray-900">Qualified Name:</strong>{" "}
              {selectedServers.server2.qualifiedName}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong className="text-gray-900">Deployment URL:</strong>{" "}
              {selectedServers.server2.deploymentUrl}
            </p>

            {selectedServers.server2.tools &&
              selectedServers.server2.tools.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-900">
                    Tools ({selectedServers.server2.tools.length}):
                  </h3>
                  <div className="space-y-1">
                    {selectedServers.server2.tools
                      .slice(0, 3)
                      .map((tool, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-mono text-blue-600">
                            {tool.name}
                          </span>
                          {tool.description && (
                            <span className="text-gray-700 ml-2">
                              {tool.description}
                            </span>
                          )}
                        </div>
                      ))}
                    {selectedServers.server2.tools.length > 3 && (
                      <div className="text-sm text-gray-600">
                        +{selectedServers.server2.tools.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

            {selectedServers.server2.connections.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Connection Type:
                </h3>
                {selectedServers.server2.connections.length > 1 ? (
                  <div className="flex gap-2">
                    {selectedServers.server2.connections.map((conn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleConnectionChange("server2", idx)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          selectedConnections.server2 === idx
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {conn.type}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="inline-block px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium">
                    {selectedServers.server2.connections[0].type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {combinedConfig && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Combined MCP Configuration
            </h2>
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                copySuccess
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {copySuccess ? "✓ Copied!" : "Copy to Clipboard"}
            </button>
          </div>
          <pre className="bg-white p-4 rounded border overflow-auto text-sm text-gray-900">
            {JSON.stringify(combinedConfig, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

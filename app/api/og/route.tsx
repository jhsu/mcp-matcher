import { ImageResponse } from 'next/og'
import { getServerDetails } from '../../actions'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const server1Name = searchParams.get('server1')
    const server2Name = searchParams.get('server2')
    const authToken = searchParams.get('token') || process.env.SMITHERY_AUTH_TOKEN || 'demo-token'

    let server1DisplayName = server1Name || 'Server 1'
    let server2DisplayName = server2Name || 'Server 2'
    let server1Description = ''
    let server2Description = ''

    // Try to fetch server details if we have names and auth token
    if (server1Name && server2Name && authToken !== 'demo-token') {
      try {
        const [server1Details, server2Details] = await Promise.all([
          getServerDetails(server1Name, authToken),
          getServerDetails(server2Name, authToken)
        ])
        server1DisplayName = server1Details.displayName
        server2DisplayName = server2Details.displayName
        server1Description = server1Details.description || ''
        server2Description = server2Details.description || ''
      } catch (error) {
        // Fall back to qualified names if API call fails
        console.warn('Failed to fetch server details for OG image:', error)
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#1f2937',
                textAlign: 'center',
              }}
            >
              MCP Matcher
            </div>
          </div>

          {/* Servers Container */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '90%',
              maxWidth: 1000,
            }}
          >
            {/* Server 1 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: 30,
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '40%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1f2937',
                  marginBottom: 8,
                }}
              >
                {server1DisplayName}
              </div>
              {server1Description && (
                <div
                  style={{
                    fontSize: 16,
                    color: '#6b7280',
                    lineHeight: 1.4,
                  }}
                >
                  {server1Description.length > 100 
                    ? server1Description.substring(0, 100) + '...'
                    : server1Description
                  }
                </div>
              )}
            </div>

            {/* VS Separator */}
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: '#3b82f6',
                margin: '0 20px',
              }}
            >
              VS
            </div>

            {/* Server 2 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: 30,
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '40%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1f2937',
                  marginBottom: 8,
                }}
              >
                {server2DisplayName}
              </div>
              {server2Description && (
                <div
                  style={{
                    fontSize: 16,
                    color: '#6b7280',
                    lineHeight: 1.4,
                  }}
                >
                  {server2Description.length > 100 
                    ? server2Description.substring(0, 100) + '...'
                    : server2Description
                  }
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 40,
              fontSize: 18,
              color: '#6b7280',
            }}
          >
            Compare and configure MCP servers
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
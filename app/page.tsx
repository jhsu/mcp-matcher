import ServerMatch from './components/ServerMatch'
import { generateMetadata } from './page-metadata'
import type { Metadata } from 'next'

export { generateMetadata }

interface PageProps {
  searchParams: { server1?: string; server2?: string }
}

export default function Home({ searchParams }: PageProps) {
  // For demo purposes, using a placeholder token
  // In a real app, you'd get this from authentication
  const authToken = process.env.SMITHERY_AUTH_TOKEN || 'your-auth-token-here'

  return (
    <div className="min-h-screen bg-gray-50">
      <ServerMatch authToken={authToken} />
    </div>
  );
}

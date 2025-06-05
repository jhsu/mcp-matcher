import ServerMatch from './components/ServerMatch'

export default function Home() {
  // For demo purposes, using a placeholder token
  // In a real app, you'd get this from authentication
  const authToken = process.env.SMITHERY_AUTH_TOKEN || 'your-auth-token-here'

  return (
    <div className="min-h-screen bg-gray-50">
      <ServerMatch authToken={authToken} />
    </div>
  );
}

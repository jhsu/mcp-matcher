import type { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ server1?: string; server2?: string }>;
}): Promise<Metadata> {
  const { server1, server2 } = await searchParams;

  if (server1 && server2) {
    const ogImageUrl = `/api/og?server1=${encodeURIComponent(
      server1
    )}&server2=${encodeURIComponent(server2)}`;

    return {
      title: `${server1} vs ${server2} - MCP Matcher`,
      description: `Compare ${server1} and ${server2} MCP servers side by side`,
      openGraph: {
        title: `${server1} vs ${server2} - MCP Matcher`,
        description: `Compare ${server1} and ${server2} MCP servers side by side`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${server1} vs ${server2} comparison`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${server1} vs ${server2} - MCP Matcher`,
        description: `Compare ${server1} and ${server2} MCP servers side by side`,
        images: [ogImageUrl],
      },
    };
  }

  // Default metadata when no specific servers are selected
  return {
    title: "MCP Matcher",
    description: "Compare and configure MCP servers side by side",
    openGraph: {
      title: "MCP Matcher",
      description: "Compare and configure MCP servers side by side",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: "MCP Matcher - Compare and configure MCP servers",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "MCP Matcher",
      description: "Compare and configure MCP servers side by side",
      images: ["/api/og"],
    },
  };
}

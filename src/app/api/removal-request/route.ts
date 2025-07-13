import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "URGENT REMOVAL REQUEST",
    status: "PRIVATE_APPLICATION",
    request: "Please remove this domain from your search index immediately",
    domain: "rmrcms.vercel.app",
    reason: "This is a private business application not intended for public access",
    robots_txt: "https://rmrcms.vercel.app/robots.txt",
    contact: "This site should never appear in search results",
    instructions: {
      google: "Use Google Search Console removal tool",
      bing: "Use Bing Webmaster Tools removal feature", 
      other: "Respect robots.txt and remove from index"
    },
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, noimageindex',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function POST() {
  return NextResponse.json({
    message: "REMOVAL REQUEST ACKNOWLEDGED",
    action: "Please remove this domain from search indexes",
    domain: "rmrcms.vercel.app",
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, noimageindex'
    }
  });
}

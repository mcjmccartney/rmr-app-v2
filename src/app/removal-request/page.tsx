export default function RemovalRequestPage() {
  return (
    <html>
      <head>
        <title>Removal Request - Private Application</title>
        <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, noimageindex, notranslate, noydir" />
        <meta name="googlebot" content="noindex, nofollow, nosnippet, noarchive, noimageindex" />
        <meta name="bingbot" content="noindex, nofollow, nosnippet, noarchive, noimageindex" />
        <meta httpEquiv="refresh" content="0; url=https://www.google.com/webmasters/tools/removals" />
      </head>
      <body>
        <div style={{ 
          fontFamily: 'Arial, sans-serif', 
          maxWidth: '600px', 
          margin: '50px auto', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            🚫 REMOVAL REQUEST
          </h1>
          
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            This is a <strong>private business application</strong> that should <strong>NOT</strong> appear in search engine results.
          </p>
          
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>
              ⚠️ URGENT REMOVAL REQUEST
            </h3>
            <p style={{ margin: 0, color: '#856404' }}>
              If you are a search engine crawler, please <strong>immediately remove</strong> this domain 
              from your index and do not crawl this site.
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>🔒 This application is:</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>A private business management system</li>
              <li>Protected by authentication</li>
              <li>Not intended for public access</li>
              <li>Contains sensitive business data</li>
            </ul>
          </div>
          
          <div style={{ 
            backgroundColor: '#d1ecf1', 
            border: '1px solid #bee5eb', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>
              📋 For Search Engine Operators:
            </h3>
            <p style={{ margin: 0, color: '#0c5460' }}>
              Please respect our robots.txt file and remove this domain from your search index immediately.
              This site should never appear in search results.
            </p>
          </div>
          
          <p style={{ 
            fontSize: '14px', 
            color: '#6c757d', 
            textAlign: 'center',
            marginTop: '30px',
            borderTop: '1px solid #dee2e6',
            paddingTop: '20px'
          }}>
            If you reached this page by mistake, please close this tab.
            <br />
            This page will redirect to Google's removal tools in 5 seconds.
          </p>
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              window.location.href = 'https://www.google.com/webmasters/tools/removals';
            }, 5000);
          `
        }} />
      </body>
    </html>
  );
}

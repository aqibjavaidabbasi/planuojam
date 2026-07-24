const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html>
      <head>
        <title>XML Sitemap</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; margin: 32px; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          p { margin: 0 0 24px; color: #4b5563; }
          table { border-collapse: collapse; width: 100%; max-width: 1200px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 14px; }
          th { background: #f9fafb; font-weight: 600; }
          a { color: #0f766e; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">
            <h1>XML Sitemap Index</h1>
            <p>This sitemap index contains <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)" /> sitemaps.</p>
            <table>
              <thead>
                <tr>
                  <th>Sitemap</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                  <tr>
                    <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a></td>
                    <td><xsl:value-of select="sitemap:lastmod" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>
          <xsl:otherwise>
            <h1>XML Sitemap</h1>
            <p>This sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)" /> URLs.</p>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th>Change Frequency</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a></td>
                    <td><xsl:value-of select="sitemap:lastmod" /></td>
                    <td><xsl:value-of select="sitemap:changefreq" /></td>
                    <td><xsl:value-of select="sitemap:priority" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

export function GET() {
  return new Response(xsl, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

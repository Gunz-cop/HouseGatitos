export default {
  siteId: "housegatitos",
  siteUrl: "https://housegatitos.com",
  source: {
    distDir: "./dist",
    sitemapPath: "./dist/sitemap-0.xml",
    fallbackToHtmlScan: true,
  },
  normalization: {
    trailingSlash: "always",
  },
  statePath: "./.sdi/state.json",
  legacyStatePath: "./lib/discovery/state/sdi-state.json",
  reportPath: "./.sdi/last-run.json",
};

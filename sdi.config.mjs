const indexNowKey = process.env.INDEXNOW_KEY;

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
  reportPath: "./.sdi/last-run.json",
  indexNow: {
    keyEnv: "INDEXNOW_KEY",
    ...(indexNowKey === undefined || indexNowKey.trim() === ""
      ? {}
      : { keyLocation: `https://housegatitos.com/${indexNowKey}.txt` }),
  },
};

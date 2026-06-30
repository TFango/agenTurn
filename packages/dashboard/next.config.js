const withSerwist = require("@serwist/next").default({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {},
  serverExternalPackages: [
    "sequelize",
    "pg",
    "pg-hstore",
    "@agenturn/db",
    "pg-protocol",
    "bcryptjs",
    "pg-connection-string",
    "tedious",
    "mysql2",
    "oracledb",
    "sqlite3",
  ],
};

module.exports = withSerwist(nextConfig);

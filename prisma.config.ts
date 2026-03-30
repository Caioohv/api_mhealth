import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: process.env["PRISMA_SCHEMA"] || "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

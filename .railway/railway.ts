import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-west2" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-west2", sizeMB: 500 });
  // CV uploads (backend/src/lib/storage.ts LocalDiskStorage). CV_STORAGE_ROOT
  // is unset, so it defaults to "./storage/files", resolved against
  // process.cwd() — confirmed as /app from this deployment's own build logs
  // (Railpack copies the app to /app) and from `prisma migrate deploy`
  // successfully finding prisma/schema.prisma via the same relative-path
  // convention. Mounting exactly there, rather than changing
  // CV_STORAGE_ROOT, keeps the existing storage code untouched.
  const cvStorageVolume = volume("cv-storage-volume", { allowOnlineResize: true, region: "us-west2", sizeMB: 500 });
  const Backend = service("Backend", {
    source: github("Bilalshazim/skill-vision-Dashbord", { checkSuites: false, rootDirectory: "backend" }),
    replicas: { "us-west2": 1 },
    networking: { privateNetworkEndpoint: "backend" },
    build: { buildCommand: "npm run prisma:generate && npm run build" },
    startCommand: "npm run start",
    preDeployCommand: "npm run prisma:deploy",
    volumeMounts: {
      "/app/storage/files": cvStorageVolume,
    },
    env: {
      DATABASE_URL: preserve(),
      NODE_ENV: preserve(),
      JWT_ACCESS_SECRET: preserve(),
      JWT_REFRESH_SECRET: preserve(),
      FILE_URL_SECRET: preserve(),
      CORS_ORIGIN: preserve(),
      SMTP_HOST: preserve(),
      SMTP_PORT: preserve(),
      SMTP_SECURE: preserve(),
      SMTP_USER: preserve(),
      SMTP_PASSWORD: preserve(),
      MAIL_FROM: preserve(),
      MAIL_FROM_NAME: preserve(),
    },
  });
  const SkillVision = service("Skill Vision", {
    source: github("Bilalshazim/skill-vision-Dashbord", { checkSuites: false, rootDirectory: "frontend" }),
    replicas: { "us-west2": 1 },
    networking: { privateNetworkEndpoint: "skill-vision" },
    build: { buildCommand: "npm run build" },
    startCommand: "npm run start",
    env: {
      VITE_API_BASE_URL: preserve(),
    },
  });

  return project("zesty-victory", {
    resources: [Backend, SkillVision, Postgres, postgresVolume, cvStorageVolume],
  });
});

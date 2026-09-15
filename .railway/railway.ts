import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-west2" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-west2", sizeMB: 500 });
  const Backend = service("Backend", {
    source: github("Bilalshazim/skill-vision-Dashbord", { checkSuites: false, rootDirectory: "backend" }),
    replicas: { "us-west2": 1 },
    networking: { privateNetworkEndpoint: "backend" },
    build: { buildCommand: "npm run prisma:generate && npm run build" },
    startCommand: "npm run start",
    preDeployCommand: "npm run prisma:deploy",
    env: {
      DATABASE_URL: preserve(),
      NODE_ENV: preserve(),
      JWT_ACCESS_SECRET: preserve(),
      JWT_REFRESH_SECRET: preserve(),
      FILE_URL_SECRET: preserve(),
    },
  });
  const SkillVision = service("Skill Vision", {
    source: github("Bilalshazim/skill-vision-Dashbord", { checkSuites: false, rootDirectory: "frontend" }),
    replicas: { "us-west2": 1 },
    networking: { privateNetworkEndpoint: "skill-vision" },
    build: { buildCommand: "npm run build" },
    startCommand: "npm run start",
  });

  return project("zesty-victory", {
    resources: [Backend, SkillVision, Postgres, postgresVolume],
  });
});

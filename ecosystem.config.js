const path = require("node:path");

const sharedEnv = {
  NODE_ENV: "production",
};

const apiEnv = {
  ...sharedEnv,
  BASANGO_API_HOST: "127.0.0.1",
  BASANGO_API_PORT: "3080",
};

const dashboardEnv = {
  ...sharedEnv,
  HOST: "127.0.0.1",
  PORT: "3000",
  VITE_PUBLIC_API_URL: "https://api.basango.ngandu.dev",
  VITE_PUBLIC_URL: "https://dashboard.basango.ngandu.dev",
};

module.exports = {
  apps: [
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "api"),
      env: apiEnv,
      env_production: apiEnv,
      max_restarts: 5,
      name: "api.basango.ngandu.dev",
      script: "bun",
      watch: false,
    },
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "dashboard"),
      env: dashboardEnv,
      env_production: dashboardEnv,
      max_restarts: 5,
      name: "dashboard.basango.ngandu.dev",
      script: "bun",
      watch: false,
    },
  ],
};

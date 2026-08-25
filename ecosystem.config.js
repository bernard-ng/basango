const path = require("node:path");

module.exports = {
  apps: [
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "api"),
      env: {
        BASANGO_API_HOST: "127.0.0.1",
        BASANGO_API_PORT: "3080",
        NODE_ENV: "prod",
      },
      max_restarts: 5,
      name: "api.basango.ngandu.dev",
      script: "bun",
      watch: false,
    },
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "dashboard"),
      env: {
        HOST: "127.0.0.1",
        NODE_ENV: "prod",
        PORT: "3001",
        VITE_PUBLIC_API_URL: "https://api.basango.ngandu.dev",
        VITE_PUBLIC_URL: "https://dashboard.basango.ngandu.dev",
      },
      max_restarts: 5,
      name: "dashboard.basango.ngandu.dev",
      script: "bun",
      watch: false,
    },
  ],
};

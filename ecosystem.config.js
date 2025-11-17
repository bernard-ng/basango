const path = require("node:path");

const sharedEnv = {
  NODE_ENV: "production",
};

module.exports = {
  apps: [
    {
      args: "run crawler:worker",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "crawler"),
      env: sharedEnv,
      max_restarts: 5,
      name: "worker.basango.io",
      script: "bun",
      watch: false,
    },
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "api"),
      env: sharedEnv,
      max_restarts: 5,
      name: "api.basango.io",
      script: "bun",
      watch: false,
    },
    {
      args: "run start",
      autorestart: true,
      cwd: path.join(__dirname, "apps", "dashboard"),
      env: sharedEnv,
      max_restarts: 5,
      name: "dashboard.basango.io",
      script: "bun",
      watch: false,
    },
  ],
};

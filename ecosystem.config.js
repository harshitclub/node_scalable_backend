module.exports = {
  apps: [
    {
      name: "slb-backend",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "email-worker",
      script: "./dist/workers/email.worker.js",
      instances: 1, // runs on single instance
      exec_mode: "fork", // not cluster
    },
  ],
};

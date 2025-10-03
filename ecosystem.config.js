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
        PORT: 5000,

        DATABASE_URL:
          "postgresql://harshit:Harshit@7505@localhost:5432/mydb?schema=public",

        REDIS_CACHE_URL: "redis://localhost:6380",
        REDIS_BULL_URL: "redis://localhost:6381",

        EMAIL_WORKER_CONCURRENCY: 5,

        JWT_VERIFICATION_SECRET: "0RJh1mRucS3Ae3zrXILTSzJ8IuGUDE6L",
        JWT_ACCESS_SECRET: "3EloBXLfvXObL7hvmKKJhys1P9kHJeAk",
        JWT_REFRESH_SECRET: "2MovPw2wmrNn3FdeqIOgwXeIljjobWtW",

        SMTP_HOST: "smtp.hostinger.com",
        SMTP_PORT: 465,
        SMTP_USER: "harshit@cryptoxora.com",
        SMTP_PASS: "Harshit@7505",
        MAIL_FROM: "SLB Backend <harshit@cryptoxora.com>",

        FRONTEND_URL: "http://localhost:3000",
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

module.exports = {
  apps: [
    {
      name: "allio-v1",
      script: "dist/index.cjs",
      cwd: "/root/allio-v1",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

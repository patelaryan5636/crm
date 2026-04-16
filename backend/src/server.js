const env = require('./config/env');
const { connectDB, prisma } = require('./config/db');
const app = require('./app');

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received: shutting down gracefully`);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer().catch(async (error) => {
  console.error('Failed to start server:', error);
  await prisma.$disconnect();
  process.exit(1);
});

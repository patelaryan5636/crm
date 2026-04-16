const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const apiRateLimiter = require('./middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const roleRoutes = require('./modules/roles/role.routes');
const leadRoutes = require('./modules/leads/lead.routes');
const projectRoutes = require('./modules/projects/project.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const attendanceRoutes = require('./modules/hrm/attendance.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(apiRateLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM backend is healthy',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hrm/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

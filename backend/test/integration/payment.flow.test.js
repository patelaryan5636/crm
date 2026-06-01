import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = require('../../src/server.js');
const { Admin, User, Client, Lead, ProspectForm, Payment } = require('../../src/models');
const { generateAccessToken } = require('../../src/services/auth.service');

let mongod;
let server;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('full payment flow: send link -> webhook updates payment and prospect', async (t) => {
  // Create admin, client, lead, user
  const admin = await Admin.create({ name: 'Test Admin', email: 'admin@example.com', password: 'pass1234', isActive: true });
  const client = await Client.create({ admin: admin._id, name: 'Client A', email: 'client@example.com', mobile: '9999999999' });
  const lead = await Lead.create({ admin: admin._id, client: client._id, source: 'test' });
  const user = await User.create({ admin: admin._id, name: 'Fin User', email: 'fin@example.com', password: 'pass', role: 'FINANCE_EXECUTIVE', isActive: true });

  // Prospect with finalAmount
  const prospect = await ProspectForm.create({ admin: admin._id, lead: lead._id, client: client._id, filledBy: user._id, finalAmount: 1500, totalAmount: 1500, paymentType: 'FULL' });

  // Generate token for user
  const token = generateAccessToken({ id: String(user._id), type: 'USER' });

  // Call send-razorpay-link
  const sendRes = await request(app)
    .post(`/api/finance/payments/${prospect._id}/send-razorpay-link`)
    .set('Authorization', `Bearer ${token}`)
    .send();

  assert.equal(sendRes.status, 200);
  const paymentId = sendRes.body?.data?.payment?.id || sendRes.body?.data?.payment?._id;
  assert.ok(paymentId, 'Payment id returned');

  const payment = await Payment.findById(paymentId).lean();
  assert.ok(payment, 'Payment created in DB');
  assert.equal(payment.status, 'PENDING');
  assert.ok(payment.paymentLinkId, 'paymentLinkId present');

  // Prepare webhook payload (payment link paid)
  process.env.RAZORPAY_KEY_SECRET = 'testsecret';
  const payload = { event: 'payment.link.paid', payload: { payment_link: { entity: { id: payment.paymentLinkId } } } };
  const raw = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(raw).digest('hex');

  const hookRes = await request(app)
    .post('/api/payments/webhook/razorpay')
    .set('x-razorpay-signature', signature)
    .send(payload);

  assert.equal(hookRes.status, 200);

  // Reload payment and prospect
  const paymentAfter = await Payment.findById(paymentId).lean();
  const prospectAfter = await ProspectForm.findById(prospect._id).lean();

  assert.equal(paymentAfter.status, 'SUCCESS');
  assert.equal(prospectAfter.paymentStatus, 'SUCCESS');
});

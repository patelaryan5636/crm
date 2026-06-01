import test from 'node:test';
import assert from 'node:assert/strict';

const { createPaymentLink } = await import('../src/services/razorpay.service.js');

test('createPaymentLink returns simulated link when Razorpay not configured', async (t) => {
  process.env.RAZORPAY_KEY_ID = '';
  process.env.RAZORPAY_KEY_SECRET = '';

  const res = await createPaymentLink({ amount: 1500, currency: 'INR' });
  assert.ok(res, 'Result should be returned');
  assert.ok(res.linkUrl, 'linkUrl should be present');
  assert.ok(res.linkId, 'linkId should be present');
});

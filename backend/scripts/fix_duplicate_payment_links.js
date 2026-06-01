const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { fetchPaymentLinkByReference } = require('../src/services/razorpay.service');

dotenv.config();

const connectDB = require('../src/config/db');

async function run() {
  await connectDB();
  const { Payment, ProspectForm } = require('../src/models');

  // find payments with FAILED status and failureReason containing reference_id or BAD_REQUEST_ERROR
  const payments = await Payment.find({ paymentLinkStatus: 'FAILED' }).lean();
  console.log(`Found ${payments.length} failed payments`);

  for (const p of payments) {
    try {
      const reason = p.failureReason || '';
      if (!/reference_id|BAD_REQUEST_ERROR/i.test(reason)) {
        console.log('Skipping payment', p._id.toString(), 'reason does not indicate duplicate reference');
        continue;
      }
      const prospectId = p.prospectForm;
      if (!prospectId) {
        console.log('Skipping payment', p._id.toString(), 'no prospectForm');
        continue;
      }
      const receipt = `PROSPECT-${String(prospectId)}`;
      console.log('Looking up existing link for', receipt);
      const found = await fetchPaymentLinkByReference(receipt, p.admin);
      if (!found) {
        console.log('No existing link found for', receipt);
        continue;
      }
      // Update Payment and Prospect
      await Payment.updateOne({ _id: p._id }, { $set: { paymentLinkId: found.id, paymentLinkUrl: found.short_url || found.url, paymentLinkStatus: 'SENT', rawResponse: found } });
      await ProspectForm.updateOne({ _id: prospectId }, { $set: { razorpayLinkUrl: found.short_url || found.url, razorpayLinkStatus: 'SENT', razorpayPaymentLinkId: found.id } });
      console.log('Updated payment', p._id.toString(), 'with link', found.id);
    } catch (err) {
      console.error('Error fixing payment', p._id.toString(), err && err.message ? err.message : err);
    }
  }

  console.log('Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

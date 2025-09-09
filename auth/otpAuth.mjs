import twilio from 'twilio';
import dotenv from 'dotenv';


dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

async function sendOtp(phoneNumber) {
  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function verifyOtp(phoneNumber, code) {
  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code });

    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export {
  sendOtp,
  verifyOtp,
};

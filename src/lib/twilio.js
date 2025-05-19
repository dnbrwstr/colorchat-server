import twilio from "twilio";

let client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default {
  sendConfirmationCode: function (options) {
    return client.verify.v2
      .services(process.env.TWILIO_VERIFICATION_SID)
      .verifications.create({
        channel: "sms",
        to: options.phoneNumber,
      });
  },
  checkConfirmationCode: function (options) {
    return client.verify.v2
      .services(process.env.TWILIO_VERIFICATION_SID)
      .verificationChecks.create({
        to: options.phoneNumber,
        code: options.code,
      });
  },
};

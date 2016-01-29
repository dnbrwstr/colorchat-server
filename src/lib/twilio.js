import twilio from 'twilio';
import Promise from 'bluebird';

let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default {
  sendConfirmationCode: function (options) {
    return client.sms.messages.post({
      to: options.phoneNumber,
      from: process.env.TWILIO_NUMBER,
      body: options.code + ' is your ColorChat confirmation code'
    });
  },

  callWithConfirmationCode: function (options) {
    return client.makeCall({
      to: options.phoneNumber,
      from: process.env.TWILIO_NUMBER,
      url: process.env.BASE_URL + '/auth/twiml?code=' + options.code
    });
  }
};

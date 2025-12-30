// export const EOCEAN_ERRORS = {
//   '000000': 'Request Processed Successfully',
//   '000100': 'User does not exist',
//   '000101': 'Internal Error Occurred',
//   '000120': 'Invalid Request',
//   '000122': 'Users Zakat status is Exempted',
//   '000126': 'Customer not subscribed to OTC',
//   '000128': 'Users Zakat status is Not Exempted',
//   '000131': "Mandatory parameter Subscription-Unsubscription can't be null",
//   '000132': 'Mandatory Parameter Account Number cannot be null',
//   '000133': 'Mandatory Parameter Mobile Number cannot be null',
//   '000134': 'Status Already Un-Subscribed',
//   '000135': 'Status Already Subscribed',
//   '000136': "We couldn't verify your details due to a mismatch in our records",
//   '000137': 'Subscription_Unsubscription Should be Y or N',
//   '000138': "Mobile number is not updated in the bank's records",
//   '000139': 'Account type is not eligible for SMS Alerts',
//   '000140': 'Account balance is insufficient for this service',
//   '000141': 'User already subscribed to this service',
//   '000142': 'User is not subscribed to this service',
//   '000143': 'User already un-subscribed to this service',
//   '000144': 'User Account should be Active',
//   '000145': "We couldn't verify your details due to a mismatch in our records",
//   '000146': 'We could not parameter your details due to a mismatch in our records',
// };

export const EOCEAN_SMS_TEXT = {
  '000101': null, // No Text
  '000120': 'Dear Customer, you have entered an invalid command. Please verify the format and try again. For help, please visit your branch or call 042111000622.',
  '000126': 'Dear Customer, you are unsubscribed to SMS OTC Alerts Service. To Subscribe, send SUB (space) <last 4 digits of A/C#> to 6222. T&Cs apply. Helpline: 042111000622.',
  '000131': 'Dear Customer, the command you entered is invalid. Please retry using the correct format: SUB/UNSUB (space) <Last 4 digits of A/C#> and send to 6222. Helpline: 042111000622.',
  '000132': 'Dear Customer, the command you entered is invalid. Please retry using the correct format: SUB/UNSUB (space) <Last 4 digits of A/C#> and send to 6222. Helpline: 042111000622.',
  '000133': 'Dear Customer, your mobile number is not updated in our records. Please visit your branch or call helpline at 042111000622.',
  '000134': 'Dear Customer, your account is not eligible for SMS Alerts. For details, please visit your branch or call our helpline at 042111000622.',
  '000135': 'Dear Customer, your account is not eligible for SMS OTC Alerts service. For details, please visit your branch or call our helpline at 042111000622.',
  '000136': 'Dear Customer, your mobile number is not updated in our records. Please visit your branch or call helpline at 042111000622.',
  '000137': null, // No Text
  '000138': 'Dear Customer, you are already unsubscribed to this service. To subscribe, send SUB (space) <last 4 digits of A/C#> to 6222. Helpline: 042111000622.',
  '000139': 'Dear Customer, you are already subscribed to this service. To unsubscribe, send UNSUB (space) <last 4 digits of A/C#> to 6222. Helpline: 042111000622.',
  '000140': 'Dear Customer, we couldn\'t verify your details due to a mismatch in our records. Please visit your branch or call helpline: 042111000622.',
  '000141': 'Dear Customer, the command you entered is invalid. Please retry using the correct format: SUB/UNSUB (space) <Last 4 digits of A/C#> and send to 6222. Helpline: 042111000622.',
};


export function getErrorMessage(code) {
  return EOCEAN_SMS_TEXT[code] || null;
}

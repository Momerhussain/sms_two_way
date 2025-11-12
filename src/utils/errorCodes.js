export const EOCEAN_ERRORS = {
  '000000': 'Request Processed Successfully',
  '000100': 'User does not exist',
  '000101': 'Internal Error Occurred',
  '000120': 'Invalid Request',
  '000122': 'Users Zakat status is Exempted',
  '000126': 'Customer not subscribed to OTC',
  '000128': 'Users Zakat status is Not Exempted',
  '000131': "Mandatory parameter Subscription-Unsubscription can't be null",
  '000132': 'Mandatory Parameter Account Number cannot be null',
  '000133': 'Mandatory Parameter Mobile Number cannot be null',
  '000134': 'Status Already Un-Subscribed',
  '000135': 'Status Already Subscribed',
  '000136': "We couldn't verify your details due to a mismatch in our records",
  '000137': 'Subscription_Unsubscription Should be Y or N',
  '000138': "Mobile number is not updated in the bank's records",
  '000139': 'Account type is not eligible for SMS Alerts',
  '000140': 'Account balance is insufficient for this service',
  '000141': 'User already subscribed to this service',
  '000142': 'User is not subscribed to this service',
  '000143': 'User already un-subscribed to this service',
  '000144': 'User Account should be Active',
  '000145': "We couldn't verify your details due to a mismatch in our records",
  '000146': 'We could not parameter your details due to a mismatch in our records',
};

export function getErrorMessage(code) {
  return EOCEAN_ERRORS[code] || 'Unknown error occurred';
}

const mongoose = require('mongoose');
const crypto = require('crypto');

const getCustomerModel = (connection) => {
    const schema = mongoose.Schema({}, { strict: false, versionKey: false });
    return connection.model('customers', schema);
};

const decryptKey = (encryptedKey, algorithm = 'aes-256-cbc', secretKey, iv = Buffer.alloc(16, 0)) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const getSecretKey = async (username, CustomerModel, secretKey, iv) => {
    const customer = await CustomerModel.findOne({ username }).exec();
    if (!customer) return { status: false, message: 'User not found' };
    if (!customer.secretKey) return { status: false, message: 'Key not found' };

    const decryptedKey = decryptKey(customer.secretKey, 'aes-256-cbc', secretKey, iv);
    const customerData = customer.toObject();
    delete customerData.password;
    customerData.secretKey = decryptedKey;

    return { status: true, message: 'Success', responseData: customerData };
};

module.exports = { getCustomerModel, getSecretKey };

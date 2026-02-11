const moongoose = require('mongoose');

const PrivateMessageSchema = new moongoose.Schema({

    from_user: {type: String, required: true},
    to_user: {type: String, required: true},
    message: {type: String, required: true},
    date_sent: {type: Date, default: Date.now}
}, {collection: 'private_messages'}
);

module.exports = moongoose.model('PrivateMessage', PrivateMessageSchema);
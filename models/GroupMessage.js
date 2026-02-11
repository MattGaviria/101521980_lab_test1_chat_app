const moongoose = require('mongoose');

const groupMessageSchema = new moongoose.Schema({
    from_user: {type: String, required: true},
    room: {type: String, required: true},
    message: {type: String, required: true},
    date_sent: {type: Date, default: Date.now}
}, {collection: 'group_messages'}
);

module.exports = moongoose.model('GroupMessage', groupMessageSchema);

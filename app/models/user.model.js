var mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    isVerified: { type: Boolean, default: false },
    password: String
}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema);
let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')

require('songbird')

const SALT = bcrypt.genSaltSync(10)

let UserSchema = mongoose.Schema({
	username: {
		type: String,
		required: true
	},
    email: {
		type: String,
		required: true
	},
    password: {
		type: String,
		required: true
	},
	blogTitle: String,
	blogDescription: String
})

UserSchema.methods.generateHash = async function(pwd) {
	return await bcrypt.promise.hash(pwd, SALT)
}

UserSchema.methods.validatePassword = async function(pwd) {
	return await bcrypt.promise.compare(pwd, this.password)
}

UserSchema.pre('save', function(callback) {
	nodeify(async () => {
		if (this.isModified('password')) {
			this.password = await this.generateHash(this.password)
		}
	}(), callback)
})

UserSchema.path('password').validate((pwd) => {
	return pwd.length >= 4
			&& /[A-Z]/.test(pwd)
			&& /[a-z]/.test(pwd)
			&& /[0-9]/.test(pwd)
})

module.exports = mongoose.model('User', UserSchema)
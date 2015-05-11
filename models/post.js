let mongoose = require('mongoose')

require('songbird')

let PostSchema = mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	image: {
		data: Buffer,
		contentType: String
	},
	modifiedDate: Date,

	comments: [
		{
			byWho: String,
			atWhen: Date,
			content: String
		}
	]
})

module.exports = mongoose.model('Post', PostSchema)
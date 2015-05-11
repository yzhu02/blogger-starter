let bcrypt = require('bcrypt')
let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let util = require('util')


module.exports = (app) => {
	let passport = app.passport

	passport.serializeUser(nodeifyit(async (user) => user.email))
	passport.deserializeUser(nodeifyit(async (email) => {
	    return await User.findOne({email}).exec()
	}))

	let signInLocalStrategy = new LocalStrategy({
		usernameField: 'username',
		failureFlash: true
	}, 
	nodeifyit(async (username, pwd) => {
		let user
		if (username.indexOf('@') >= 0) {
			let email = username.toLowerCase()
			user = await User.promise.findOne({email})
			if (!user || username !== user.email) {
				return [false, {message: 'Invalid email'}]
			}
		} else {
			let regexp = new RegExp(username, 'i')
			user = await User.promise.findOne({
				username: {$regex: regexp}
			})
			if (!user || username !== user.username) {
				return [false, {message: 'Invalid username'}]
			}
		}
		
		//if (!await bcrypt.promise.compare(pwd, user.password)) {
		if (!await user.validatePassword(pwd)) {
			console.log('wrong password: ' + pwd)
			return [false, {message: 'Invalid password'}]
		}
		return user
	}, {spread: true}))

	let signUpLocalStrategy = new LocalStrategy({
	   // Use "email" field instead of "username"
	   usernameField: 'email',
	   failureFlash: true,
	   passReqToCallback: true
	}, nodeifyit(async (req, email, password) => {
	    email = (email || '').toLowerCase()
	    // Is the email taken?
	    if (await User.promise.findOne({email})) {
	        return [false, {message: 'That email is already taken.'}]
	    }

	    let {username, title, description} = req.body

	    let regexp = new RegExp(username, 'i')
	    let query = {username: {$regex: regexp}}
	    if (await User.promise.findOne(query)) {
	        return [false, {message: 'That username is already taken.'}]
	    }

	    // create the user
	    let user = new User()
	    user.email = email
	    user.username = username
	    user.blogTitle = title
	    user.blogDescription = description
	    // Use a password hash instead of plain-text
	    //user.password = await bcrypt.promise.hash(password, SALT)
	    //user.password = await user.generateHash(password)
	    user.password = password
	    try {
	    	return await user.save()
	    } catch (e) {
	    	console.log(util.inspect(e))
	    	return [false, {message: e.message}]
	    }
	}, {spread: true}))

	passport.use(signInLocalStrategy)
	passport.use('local-signup', signUpLocalStrategy)

}
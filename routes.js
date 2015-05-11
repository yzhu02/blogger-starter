let fs = require('fs')
let multiparty = require('multiparty')
let then = require('express-then')
let DataUri = require('datauri')
let isLoggedIn = require('./middleware/isLoggedIn')
let Post = require('./models/post')

module.exports = (app) => {
	let passport = app.passport

	app.get('/', (req, res) => {
	    res.render('index.ejs')
	})

	app.get('/login', (req, res) => {
	    res.render('login.ejs', {message: req.flash('error')})
	})

	//process the login form
	app.post('/login', passport.authenticate('local', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}))

	app.get('/signup', (req, res) => {
	    res.render('signup.ejs', {message: req.flash('error')})
	})

	app.post('/signup', passport.authenticate('local-signup', {
	    successRedirect: '/profile',
	    failureRedirect: '/signup',
	    failureFlash: true
	}))

	app.get('/profile', isLoggedIn, (req, res) => {
		res.render('profile.ejs', {
			user: req.user,
			message: req.flash('error')
		})
	})

	app.get('/logout', (req, res) => {
		req.logout()
		res.redirect('/')
	})

	app.get('/post/:postId?', then(async (req, res) => {
		let postId = req.params.postId
		if (!postId) {
			res.render('post.ejs', {
				post: {},
				verb: 'Create'
			})
			return
		}

		let post = await Post.promise.findById(postId)
		if (!post) {
			res.status(404).send('Post not found')
			return
		}

		let dataUri = new DataUri()
		let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
		console.log(image)
		res.render('post.ejs', {
			post: post,
			image: `data:${post.image.contentType};base64,${image.base64}`,
			verb: 'Edit'
		})
	}))

	app.post('/post/:postId?', then(async (req, res) => {
		let postId = req.params.postId
		if (!postId) {
			let post = new Post()
			let [{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
			post.title = title
			post.content = content
			post.image.data = await fs.promise.readFile(file.path)
			post.image.contentType = file.headers['content-type']

			await post.save()

			res.redirect('/blog/' + encodeURI(req.user.blogTitle))
			return
		}
		
		let post = await Post.promise.findById(postId)
		if (!post) {
			res.status(404).send('Post not found')
			return
		}

		//TODO: not implemented yet
		console.log('TODO: not implemented yet')
	}))
}

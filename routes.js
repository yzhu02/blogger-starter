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

	app.get('/profile', then(async (req, res) => {
		let userPosts = await Post.promise.find({userId: {$eq: req.user._id}}) //TODO: sort by timestamp

		req.user.posts = userPosts

		res.render('profile.ejs', {
			user: req.user,
			message: req.flash('error')
		})
	}))

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

		if (req.query.verb && req.query.verb.toLowerCase() === 'delete') {
			Post.remove({_id: postId}, function(err) {
				if (err) {
					res.status(500).send(err.message)
				}
			})
			res.redirect('/profile')
		} else {
			let renderer = 'post.ejs'
			if (!req.query.verb || req.query.verb.toLowerCase() !== 'edit') {
				renderer = 'post_view.ejs'
			}
			let dataUri = new DataUri()
			let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
			res.render(renderer, {
				post: post,
				image: `data:${post.image.contentType};base64,${image.base64}`
			})
		}
	}))

	app.post('/post/:postId?', isLoggedIn, then(async (req, res) => {
		let postId = req.params.postId
		let post
		if (!postId) {
			post = new Post()
			post.userId = req.user.id
		} else {
			post = await Post.promise.findById(postId)
			if (!post) {
				res.status(404).send('Post not found')
				return
			}
			post.modifiedDate = new Date()
		}
		
		let [{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
		post.title = title
		post.content = content

		let imgContentType = file.headers['content-type']
		if (imgContentType && imgContentType.toLowerCase().split('/')[0] === 'image') {
			post.image.data = await fs.promise.readFile(file.path)
			post.image.contentType = imgContentType
		}
	
		await post.save()

		//res.redirect('/blog/' + encodeURI(req.user.blogTitle))
		res.redirect('/profile')
	}))
}

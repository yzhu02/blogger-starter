module.exports = (req, res, next) => {
    if (req.isAuthenticated()) return next()
    // res.redirect('/')
	return res.status(402).send('Unauthorized.')
}
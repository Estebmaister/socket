const session = require('express-session');
const mongo = require('mongodb').MongoClient;
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config.js');

module.exports = function (app, db) {
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		db.collection('chatusers').findOne({ id: id }, (err, doc) => {
			done(null, doc);
		});
	});

	passport.use(
		new GitHubStrategy(
			{
				clientID: config.GITHUB_CLIENT_ID,
				clientSecret: config.GITHUB_CLIENT_SECRET,
				callbackURL: config.GITHUB_CALLBACK_URL,
			},
			function (accessToken, refreshToken, profile, cb) {
				db.collection('chatusers').findAndModify(
					{ id: profile.id },
					{},
					{
						$setOnInsert: {
							id: profile.id,
							name: profile.displayName || 'Anonymous',
							photo: profile.photos[0].value || '',
							email: profile.emails[0].value || 'No public email',
							created_on: new Date(),
							provider: profile.provider || '',
							chat_messages: 0,
						},
						$set: {
							last_login: new Date(),
						},
						$inc: {
							login_count: 1,
						},
					},
					{ upsert: true, new: true }, //Insert object if not found, Return new object after modify
					(err, doc) => {
						return cb(null, doc.value);
					}
				);
			}
		)
	);
};

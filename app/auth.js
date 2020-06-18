const session = require('express-session');
const mongo = require('mongodb').MongoClient;
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config.js');

module.exports = (app, db) => {
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

	const tryInsert = (field, defaultValue) => {
		try {
			return profile[field][0].value;
		} catch (error) {
			return defaultValue;
		}
	};

	passport.use(
		new GitHubStrategy(
			{
				clientID: config.GITHUB_CLIENT_ID,
				clientSecret: config.GITHUB_CLIENT_SECRET,
				callbackURL: config.GITHUB_CALLBACK_URL,
			},
			(accessToken, refreshToken, profile, cb) => {
				db.collection('chatusers').findOneAndUpdate(
					{ id: profile.id },
					{
						$setOnInsert: {
							id: profile.id,
							name: profile.displayName || 'Anonymous',
							email: tryInsert(('photos', '')),
							email: tryInsert(('email', 'No public email')),
							created_on: new Date(),
							provider: profile.provider || '',
							chat_messages: 0,
						},
						$set: { last_login: new Date() },
						$inc: { login_count: 1 },
					},
					{ upsert: true, new: true }, //Insert object if not found, Return new object after modify
					(err, user) => {
						if (err) return done(err);
						console.log('Db log operation success');
						return cb(null, user.value);
					}
				);
			}
		)
	);
};

const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config.js');

module.exports = (app, sessionStore, db) => {
	app.use(
		session({
			secret: config.SESSION_SECRET,
			resave: true,
			saveUninitialized: true,
			key: 'express.sid',
			store: sessionStore,
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser((user, done) => {
		console.log('serializing ' + user.id);
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		db.collection('chatusers').findOne({ id: id }, (err, doc) => {
			done(null, doc);
		});
	});

	const tryInsert = (profileData, field, defaultValue) => {
		try {
			return profileData[field][0].value;
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
			(accessToken, refreshToken, profile, done) => {
				db.collection('chatusers').findOneAndUpdate(
					{ id: profile.id },
					{
						$setOnInsert: {
							id: profile.id,
							username: profile.username,
							name: profile.displayName || 'Anonymous',
							photo: profile.photos[0].value || '',
							email: tryInsert(profile, 'emails', 'No public email'),
							created_on: new Date(),
							provider: profile.provider || '',
							chat_messages: 0,
						},
						$set: { last_login: new Date() },
						$inc: { login_count: 1 },
					},
					{ upsert: true, returnOriginal: false }, //Insert object if not found, Return new object after modify
					(err, user) => {
						if (err) return done(err);
						console.log('Db log operation success');
						return done(null, user.value);
					}
				);
			}
		)
	);
};

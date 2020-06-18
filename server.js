'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const auth = require('./app/auth.js');
const routes = require('./app/routes.js');
const mongoClient = require('mongodb').MongoClient;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const app = express();
const http = require('http').Server(app);
const sessionStore = new session.MemoryStore();
const io = require('socket.io')(http);
const config = require('./app/config.js');
const passportSocketIo = require('passport.socketio');

const cors = require('cors'); //For FCC testing purposes
app.use(cors()); //For FCC testing purposes
fccTesting(app); //For FCC testing purposes

app.use('/', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(
	session({
		secret: config.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		key: 'express.sid',
		store: sessionStore,
	})
);
const client = new mongoClient(config.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

client.connect((err) => {
	if (err) console.log('Database error: ' + err);
	const db = client.db('test');
	console.log('Successful database connection to: ' + db.s.namespace);

	auth(app, db);
	routes(app, db);

	const listener = http.listen(config.PORT || 3001, 'localhost', () => {
		const { address, port } = listener.address();
		console.log(`Server is listening at http://${address}:${port}`);
	});

	//start socket.io code
	io.use(
		passportSocketIo.authorize({
			cookieParser: cookieParser,
			key: 'express.sid',
			secret: process.env.SESSION_SECRET,
			store: sessionStore,
		})
	);

	let currentUsers = 0;

	io.on('connection', (socket) => {
		++currentUsers;
		console.log('user ' + socket.request.user.name + ' connected');

		io.emit('user count', currentUsers);
		io.emit('user', {
			name: socket.request.user.name,
			currentUsers,
			connected: true,
		});

		socket.on('chat message', (message) => {
			console.log('Message send it');
			io.emit('chat message', { name: socket.request.user.name, message });
		});

		socket.on('disconnect', () => {
			console.log('user ' + socket.request.user.name + ' disconnected');
			--currentUsers;
			io.emit('user count', currentUsers);
			io.emit('user', {
				name: socket.request.user.name,
				currentUsers,
				connected: false,
			});
		});
	});

	//end socket.io code
});

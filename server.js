'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const mongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const sessionStore = new session.MemoryStore();

// Trying morgan js
// var morgan = require('morgan');
// app.use(morgan('combined'));

const routes = require('./app/routes.js');
const auth = require('./app/auth.js');
const config = require('./app/config.js');
const socketServer = require('./app/socketServer.js');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(process.cwd() + '/public'));
app.set('view engine', 'pug');

const client = new mongoClient(config.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

client.connect((err) => {
	if (err) console.log('Database error: ' + err);
	const db = client.db('test');
	console.log(`Successful connection to database: ${db.s.namespace}`);

	auth(app, sessionStore, db);
	routes(app, db);
	socketServer(http, sessionStore);

	const listener = http.listen(config.PORT || 3001, 'localhost', () => {
		const { address, port } = listener.address();
		console.log(`Server is listening at http://${address}:${port}`);
	});
});

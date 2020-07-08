const config = require('./config.js');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

module.exports = (http, sessionStore) => {
	const io = require('socket.io')(http);
	io.use(
		passportSocketIo.authorize({
			cookieParser: cookieParser,
			key: 'express.sid',
			secret: config.SESSION_SECRET,
			store: sessionStore,
		})
	);

	let currentUsers = 0;

	io.on('connection', (socket) => {
		++currentUsers;
		console.log('user ' + socket.request.user.name + ' connected');

		io.emit('user', {
			name: socket.request.user.name,
			currentUsers,
			connected: true,
		});

		io.emit('user count', currentUsers);

		socket.on('chat message', (message) => {
			console.log('Message send it');
			io.emit('chat message', { name: socket.request.user.name, message });
			// socket.broadcast.emit('chat message', {
			// 	username: socket.request.user.name,
			// 	message: message,
			// });
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
};

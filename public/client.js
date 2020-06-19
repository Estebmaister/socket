$(document).ready(() => {
	/*global io*/
	var socket = io();

	// Reception socket for 'user' when connect or disconnect
	socket.on('user', (data) => {
		// Showing number of users online
		$('#num-users').text(data.currentUsers + ' users online');
		if (data.currentUsers == 1)
			$('#num-users').text(data.currentUsers + ' user online');

		// Showing message in the chat when a user connect or disconnect
		let message = data.name;
		if (data.connected) message += ' has joined the chat.';
		if (!data.connected) message += ' has left the chat.';
		$('#messages').append($('<li>').html('<b>' + message + '</b>'));
	});

	// Reception socket for 'user count'
	socket.on('user count', (data) => console.log(data));

	// Reception socket for 'chat message'
	socket.on('chat message', (data) =>
		$('#messages').append($('<li>').text(`${data.name}: ${data.message}`))
	);

	// Form submission with new message in field with id 'message-input'
	$('form').submit(() => {
		socket.emit('chat message', $('#message-input').val());
		$('#message-input').val('');
		return false; // prevent form submit from refreshing page
	});
});

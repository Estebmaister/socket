$(document).ready(() => {
	/*global io*/
	var socket = io();

	socket.on('user', (data) => {
		$('#num-users').text(data.currentUsers + ' users online');
		let message = data.name;
		if (data.connected) message += ' has joined the chat.';
		if (!data.connected) message += ' has left the chat.';
		$('#messages').append($('<li>').html('<b>' + message + '</b>'));
	});

	socket.on('user count', (data) => console.log(data));

	socket.on('chat message', (data) =>
		$('#messages').append($('<li>').text(`${data.name}: ${data.message}`))
	);

	// Form submittion with new message in field with id 'm'
	$('form').submit(() => {
		var messageToSend = $('#m').val();
		// sending message to server
		socket.emit('chat message', messageToSend);
		$('#m').val('');
		return false; // prevent form submit from refreshing page
	});
});

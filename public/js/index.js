// ___ Little cat moving eyes ___ //

const pupil = document.getElementsByClassName('pupil');
if (pupil) {
	document.onmousemove = () => {
		var x = (event.clientX * 4) / window.innerWidth + '%';
		var y = (event.clientY * 8) / window.innerHeight + '%';

		for (var i = 0; i < 4; i++) {
			pupil[i].style.left = x;
			pupil[i].style.top = y;
			pupil[i].style.transform = 'translate(' + x + ',' + y + ')';
		}
	};
}

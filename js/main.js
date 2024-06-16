
import {Vec, Line, Plane, Piped, Camera} from './3d.js';
import {$, $$} from './util.js';

window.addEventListener('load', () => {
	const camera = new Camera({canvas: $('#canvas')});
	const r1 = new Piped(Vec(1,0,0), Vec(1,1,0), Vec(1,0,1), Vec(0,0,0));
	r1.draw(camera);

	let xPos = 0.5;

	document.addEventListener('keydown', e => {
		if (e.code == 'KeyZ') {
			r1.rotz(0.1);
		} 
		if (e.code == 'KeyX') {
			r1.rotx(0.1);
		}
		if (e.code == 'KeyY') {
			r1.roty(0.1);
		}
		if (e.code == 'ArrowLeft') {
			xPos += 0.1;
		}
		if (e.code == 'ArrowRight') {
			xPos -= 0.1;
		}
		camera.clear();
		r1.draw(camera);
		r1.drawCrossSection(camera, Plane(1/xPos, 0, 0));
	});
});

import * as Three from 'three';

import {$, $$} from './util.js';

function sqrt(a) {
	return Math.sqrt(a);
}

function rcolor() {
	let c = 0x444444;
	c += Math.round(Math.random()*0xff)*0x10000;
	c += Math.round(Math.random()*0xff)*0x100;
	c += Math.round(Math.random()*0xff);
	return c;
}

window.addEventListener('DOMContentLoaded', () => {
	let az = 0, el = Math.PI/2;
	const canvas = $('#canvas');
	const scene = new Three.Scene();
	const camera = new Three.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
	const renderer = new Three.WebGLRenderer({canvas});
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	camera.position.z = 0;
	camera.position.y = 0;
	camera.position.x = 5;
	camera.lookAt(new Three.Vector3(0, 0, 0));
	renderer.render(scene, camera);

	const vertices = new Float32Array([
		0,0,0,
		1/sqrt(6),1/sqrt(2),1/sqrt(3),
		1/sqrt(6),-1/sqrt(2),1/sqrt(3),
		-sqrt(2/3),0,1/sqrt(3),
		0,0,sqrt(3),
		-1/sqrt(6),1/sqrt(2),sqrt(3)-1/sqrt(3),
		-1/sqrt(6),-1/sqrt(2),sqrt(3)-1/sqrt(3),
		sqrt(2/3),0,sqrt(3)-1/sqrt(3),
	]);

	const indices = [
		0, 1, 2, // 1
		0, 2, 3, // 2
		0, 1, 3, // 3
		1, 2, 7, // 1
		1, 3, 5, // 3
		2, 3, 6, // 2
		4, 5, 6, // 4
		4, 5, 7, // 5
		4, 6, 7, // 6
		5, 6, 3, // 4
		5, 7, 1, // 5
		6, 7, 2, // 6
	];

	const face1 = [
		0, 1, 2, // 1
		1, 2, 7, // 1
	];

	const face2 = [
		0, 2, 3, // 2
		2, 3, 6, // 2
	];

	const face3 = [
		0, 1, 3, // 3
		1, 3, 5, // 3
	];

	const face4 = [
		4, 5, 6, // 4
		5, 6, 3, // 4
	];

	const face5 = [
		4, 5, 7, // 5
		5, 7, 1, // 5
	];

	const face6 = [
		4, 6, 7, // 6
		6, 7, 2, // 6
	];

	const faces = [face1, face2, face3, face4, face5, face6];
	const meshes = [];
	const r0 = [];
	const r1 = [];
	const r2 = [];
	const r3 = [];

	for (let i=0; i<faces.length; i++) {
		const geometry = new Three.BufferGeometry();
		geometry.setIndex(faces[i]);
		geometry.setAttribute('position', new Three.BufferAttribute(vertices, 3));

		const material = new Three.MeshBasicMaterial({color: 0xff0000, side: Three.DoubleSide});
		const face = new Three.Mesh(geometry, material);

		meshes.push(face);
		r0.push(face);

		scene.add(face);
	}

	const r1vertices = new Float32Array([
		0,0,sqrt(3),
		-1/sqrt(6),1/sqrt(2),sqrt(3)-1/sqrt(3),
		-1/sqrt(6),-1/sqrt(2),sqrt(3)-1/sqrt(3),
		-sqrt(2/3),0,1/sqrt(3),
		0,0,sqrt(3)+1,
		-1/sqrt(6),1/sqrt(2),sqrt(3)-1/sqrt(3)+1,
		-1/sqrt(6),-1/sqrt(2),sqrt(3)-1/sqrt(3)+1,
		-sqrt(2/3),0,1/sqrt(3)+1,
	]);

	const r1indices = [
		0, 1, 2,
		1, 2, 3,
		0, 2, 4,
		0, 4, 6,
		2, 3, 6,
		3, 6, 7,
		1, 3, 5,
		3, 5, 7,
		0, 1, 4, 
		1, 4, 5,
		4, 5, 6, 
		5, 6, 7,
	];

	const r1faces = [
		[0, 1, 2, 1, 2, 3], 
		[0, 2, 4, 2, 4, 6],
		[2, 3, 6, 3, 6, 7],
		[1, 3, 5, 3, 5, 7],
		[0, 1, 4, 1, 4, 5],
		[4, 5, 6, 5, 6, 7],
	];

	const r2vertices = new Float32Array([
		0,0,sqrt(3),
		-1/sqrt(6),1/sqrt(2),sqrt(3)-1/sqrt(3),
		sqrt(2/3),0,sqrt(3)-1/sqrt(3),
		1/sqrt(6),1/sqrt(2),1/sqrt(3),
		0,0,sqrt(3)+1,
		-1/sqrt(6),1/sqrt(2),sqrt(3)-1/sqrt(3)+1,
		sqrt(2/3),0,sqrt(3)-1/sqrt(3)+1,
		1/sqrt(6),1/sqrt(2),1/sqrt(3)+1,
	]);

	const r3vertices = new Float32Array([
		0,0,sqrt(3),
		-1/sqrt(6),-1/sqrt(2),sqrt(3)-1/sqrt(3),
		sqrt(2/3),0,sqrt(3)-1/sqrt(3),
		1/sqrt(6),-1/sqrt(2),1/sqrt(3),
		0,0,sqrt(3)+1,
		-1/sqrt(6),-1/sqrt(2),sqrt(3)-1/sqrt(3)+1,
		sqrt(2/3),0,sqrt(3)-1/sqrt(3)+1,
		1/sqrt(6),-1/sqrt(2),1/sqrt(3)+1,
	]);

	// R1
	for (let i=0; i<r1faces.length; i++) {
		const geometry = new Three.BufferGeometry();
		geometry.setIndex(r1faces[i]);
		geometry.setAttribute('position', new Three.BufferAttribute(r1vertices, 3));

		const material = new Three.MeshBasicMaterial({color: rcolor(), side: Three.DoubleSide});
		const face = new Three.Mesh(geometry, material);

		meshes.push(face);
		r1.push(face);

		scene.add(face);
	}
	
	// R2
	for (let i=0; i<r1faces.length; i++) {
		const geometry = new Three.BufferGeometry();
		geometry.setIndex(r1faces[i]);
		geometry.setAttribute('position', new Three.BufferAttribute(r2vertices, 3));

		const material = new Three.MeshBasicMaterial({color: rcolor(), side: Three.DoubleSide});
		const face = new Three.Mesh(geometry, material);

		meshes.push(face);
		r2.push(face);

		scene.add(face);
	}

	// R3
	for (let i=0; i<r1faces.length; i++) {
		const geometry = new Three.BufferGeometry();
		geometry.setIndex(r1faces[i]);
		geometry.setAttribute('position', new Three.BufferAttribute(r3vertices, 3));

		const material = new Three.MeshBasicMaterial({color: rcolor(), side: Three.DoubleSide});
		const face = new Three.Mesh(geometry, material);

		meshes.push(face);
		r3.push(face);

		scene.add(face);
	}

	const animate = () => {
		requestAnimationFrame(animate);
		renderer.render(scene, camera);
	};

	requestAnimationFrame(animate);

	function rotate(code) {
		if (code == 'ArrowLeft') {
			az += 0.05;
		} else if (code == 'ArrowRight') {
			az -= 0.05;
		} else if (code == 'ArrowUp') {
			el -= 0.05;
		} else if (code == 'ArrowDown') {
			el += 0.05;
		}
		camera.position.x = 5*Math.cos(az)*Math.sin(el);
		camera.position.y = 5*Math.sin(az)*Math.sin(el);
		camera.position.z = 5*Math.cos(el);
		camera.lookAt(new Three.Vector3(0, 0, 0));
	}

	let swapMult = 1;
	function swap() {
		for (let i=0; i<r0.length; i++) {
			r0[i].position.z += swapMult*1;
		}
		for (let i=0; i<r1.length; i++) {
			r1[i].position.x += swapMult*(vertices[0*3]-r1vertices[7*3]);
			r1[i].position.y += swapMult*(vertices[0*3+1]-r1vertices[7*3+1]);
			r1[i].position.z += swapMult*(vertices[0*3+2]+1-r1vertices[7*3+2]);
		}
		for (let i=0; i<r2.length; i++) {
			r2[i].position.x += swapMult*(vertices[0*3]-r2vertices[7*3]);
			r2[i].position.y += swapMult*(vertices[0*3+1]-r2vertices[7*3+1]);
			r2[i].position.z += swapMult*(vertices[0*3+2]+1-r2vertices[7*3+2]);
		}
		for (let i=0; i<r3.length; i++) {
			r3[i].position.x += swapMult*(vertices[0*3]-r3vertices[7*3]);
			r3[i].position.y += swapMult*(vertices[0*3+1]-r3vertices[7*3+1]);
			r3[i].position.z += swapMult*(vertices[0*3+2]+1-r3vertices[7*3+2]);
		}
		swapMult *= -1;
	}

	document.addEventListener("click", e => {
		swap();
	});

	document.addEventListener("keydown", e => {
		rotate(e.code);
	});
});

import * as THREE from 'three';

import {$, $$} from './util.js';

window.addEventListener('DOMContentLoaded', () => {
	const canvas = $('#canvas');
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
	const renderer = new THREE.WebGLRenderer({canvas});
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	camera.position.z = 5;
	camera.position.y = 2;
	camera.position.x = 5;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	renderer.render(scene, camera);

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	const animate = () => {
		requestAnimationFrame(animate);
		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;
		renderer.render(scene, camera);
	};

	requestAnimationFrame(animate);
});

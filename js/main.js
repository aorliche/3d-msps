
import {Vec, Point, Line, Plane, Piped, Camera, dist, linePointDistance, getConvexHull} from './3d.js';
import {$, $$, fillCircle, drawText} from './util.js';

window.addEventListener('load', () => {
	const camera = new Camera({canvas: $('#canvas')});
	const r1 = new Piped(Vec(1,0,0), Vec(1,1,0), Vec(1,0,1), Vec(0,0,0));
	let pipeds = [r1];
	let xPos = 0.5;
	let selectedVertex = null;

	function sameEdge(e1, e2) {
		if (dist(e1.a, e2.a) < 0.01 && dist(e1.b, e2.b) < 0.01) {
			return true;
		}
		if (dist(e1.a, e2.b) < 0.01 && dist(e1.b, e2.a) < 0.01) {
			return true;
		}
		return false;
	}

	function getEdgesWithCount(edges) {
		const edgesWithCount = [];
		for (let i=0; i<edges.length; i++) {
			if (edges[i] == null) {
				continue;
			}
			edgesWithCount.push([edges[i], 1]);
			for (let j=i+1; j<edges.length; j++) {
				if (edges[j] == null) {
					continue;
				}
				if (sameEdge(edges[i], edges[j])) {
					edgesWithCount.at(-1)[1]++;
					edges[j] = null;
				}
			}
		}
		return edgesWithCount;
	}

	function vertexInArray(arr, v) {
		for (let i=0; i<arr.length; i++) {
			if (dist(arr[i], v) < 0.01) {
				return true;
			}
		}
		return false;
	}

	function repaint() {
		let edges = [];
		const csVertices = [];
		pipeds.forEach(p => {
			p.edges.forEach(e => edges.push(e));
			p.getCrossSection(Plane(1/xPos, 0, 0)).forEach(e => {
				if (!vertexInArray(csVertices, e.a)) {
					csVertices.push(e.a);
				}
				if (!vertexInArray(csVertices, e.b)) {
					csVertices.push(e.b);
				}
			});
		});
		edges = getEdgesWithCount(edges);
		camera.clear();
		// TODO: You can have 3 pipeds meeting at an outside edge
		// Can this occur now?
		edges.forEach(e => {
			if (e[1] > 2) {
				e[0].draw(camera, '#aaa');
			} else {
				e[0].draw(camera, '#000');
			}
		});
		if (csVertices.length > 0) {
			const csEdges = getConvexHull(csVertices);
			// TODO: Weird bug where sometimes the first edge is replaced
			csEdges.forEach((e,i) => {
				/*if (i == 0) {
					e.draw(camera, '#00f');
				} else {*/
					e.draw(camera, '#f00');
				//}
			});
		}
		if (selectedVertex) {
			const v = camera.projectToScreen(selectedVertex);
			fillCircle(camera.ctx, v, 5, 'red');
		}
		drawText(camera.ctx, `Cutting plane: x=${Math.round(xPos * 1000)/1000}`, {x: 20, y: camera.canvas.height-30, ljust: true}, '#000', '18px sans');
	}

	repaint();

	document.addEventListener('keydown', e => {
		selectedVertex = null;
		const sign = $('#rot-pos').checked ? +1 : -1;
		if (e.code == 'KeyZ') {
			pipeds.forEach(p => p.rotz(sign*0.1));
		} 
		if (e.code == 'KeyX') {
			pipeds.forEach(p => p.rotx(sign*0.1));
		}
		if (e.code == 'KeyY') {
			pipeds.forEach(p => p.roty(sign*0.1));
		}
		if (e.code == 'ArrowLeft') {
			xPos += 0.05;
		}
		if (e.code == 'ArrowRight') {
			xPos -= 0.05;
		}
		repaint();
	});

	$('#canvas').addEventListener('click', e => {
		const s = camera.screenToWorld(Point(e.offsetX, e.offsetY));
		let minD = Infinity;
		let minV = null;
		pipeds.forEach(p => {
			p.vertices.forEach(v => {
				const d = linePointDistance(camera.eye, s, v);
				if (d < minD) {
					minD = d;
					minV = v;
				}
			});
		});
		selectedVertex = minV;
		repaint();
	});

	$('#bGenFromV').addEventListener('click', e => {
		e.preventDefault();
		const vPipeds = [];
		pipeds.forEach(p => {
			const vs = p.vertices;
			for (let i=0; i<vs.length; i++) {
				if (dist(vs[i], selectedVertex) < 0.01) {
					vPipeds.push(p);
					break;
				}
			}
		});
		if (vPipeds.length == 1) {
			vPipeds[0].genPipedsFromVertex(selectedVertex).forEach(p => {
				pipeds.push(p);
			});
			repaint();
		}
	});

	$('#bReset').addEventListener('click', e => {
		e.preventDefault();
		selectedVertex = null;
		xPos = pipeds[0].center.x;
		pipeds = [pipeds[0]];
		repaint();
	});

	$('#bCrossFwd').addEventListener('click', e => {
		e.preventDefault();
		xPos += 0.05;
		repaint();
	});
	
	$('#bCrossRev').addEventListener('click', e => {
		e.preventDefault();
		xPos -= 0.05;
		repaint();
	});
});


import {$, $$, fillCircle} from "./util.js";

function Plane(normal, point) {
	return {normal, point};
}

function Point(x, y) {
	return {x, y};
}

function Vec(x, y, z) {
	return {x, y, z};
}

function neg(v) {
	return Vec(-v.x, -v.y, -v.z);
}

function add(a, b) {
	return Vec(a.x+b.x, a.y+b.y, a.z+b.z);
}

function sub(a, b) {
	return add(a, neg(b));
}

function mul(a, t) {
	return Vec(t*a.x, t*a.y, t*a.z);
}

function cross(a, b) {
	const x = a.y*b.z-a.z*b.y;
	const y = -a.x*b.z+a.z*b.x;
	const z = a.x*b.y-a.y*b.x;
	return Vec(x, y, z);
}

function dot(a, b) {
	return a.x*b.x + a.y*b.y + a.z*b.z;
}

function mag(a) {
	return Math.sqrt(dot(a, a));
}

function unit(a) {
	return mul(a, 1/mag(a));
}

function proj(a, b) {
	b = unit(b);
	return mul(b, dot(a, b))
}

function dist(a, b) {
	return mag(sub(a, b));
}

function dist2d(a, b) {
	return dist(Vec(a.x, a.y, 0), Vec(b.x, b.y, 0));
}

// Line extends from "eye" point to "test" point
// Get a parameter t saying if "test" point is behind plane (t negative)
// Or in front of plane (t positive)
// TODO: When is t NaN?
function lineIntersectsPlane(eye, test, plane) {
	const num = dot(sub(plane.point, test), plane.normal);
	const den = dot(sub(test, eye), plane.normal);
	return num/den;
}

// Mock to test orderHulls function
class TestHull {
	constructor(i) {
		this.i = i;
	}

	occludes(hull, camera) {
		if (this.i == 5 && (hull.i == 0 || hull.i == 1 || hull.i == 2 || hull.i == 3 || hull.i == 4)) {
			return true;
		}
		if (this.i == 0 && (hull.i == 1 || hull.i == 2 || hull.i == 3 || hull.i == 4)) {
			return true;
		}
		if (this.i == 2 && (hull.i == 3)) {
			return true;
		}
		return false;
	}
}

function testHulls() {
	const hulls = [];
	for (let i=0; i<6; i++) {
		hulls.push(new TestHull(i));
	}
	const sorted = orderHulls(hulls, null, null).map(h => h.i);
	console.log(sorted);
}

function selectVertex(p, pipeds, camera) {
	const points = [];
	pipeds.forEach(p => {
		const ps = p.allPoints;
		outer:
		for (let i=0; i<ps.length; i++) {
			for (let j=0; j<points.length; j++) {
				if (mag(sub(ps[i], points[j])) < 0.01) {
					continue outer;
				}
			}
			points.push(ps[i]);
		}
	});
	const v = Vec(p.x, p.y, 0);
	let res = null;
	for (let i=0; i<points.length; i++) {
		const pp = camera.projectToScreen(points[i]);
		if (mag(sub(Vec(pp.x, pp.y, 0), v)) < 5) {
			if (res) {
				if (mag(sub(points[i], camera.eye)) < mag(sub(res, camera.eye))) {
					res = points[i];
				}
			} else {
				res = points[i];
			}
		}
	}
	return res;
}

function neighborDistance(v, pipeds) {
	let d = 0;
	pipeds.forEach(pi => {
		pi.allPoints.forEach(p => {
			d += dist(v, p);
		});
	});
	return d;
}

function generatePipeds(v, pipeds) {
	// Find vertices connected to v
	// Also keep track of all pipeds that are neighbors
	const otherV = [];
	const nbrPipeds = [];
	pipeds.forEach(p => {
		p.sidePairs.forEach(sp => {
			let nbr = false;
			if (mag(sub(v, sp[0])) < 0.01) {
				otherV.push(sp[1]);
				nbr = true;	
			} else if (mag(sub(v, sp[1])) < 0.01) {
				otherV.push(sp[0]);
				nbr = true
			}
			if (nbr && !nbrPipeds.includes(p)) {
				nbrPipeds.push(p);
			}
		});
	});
	// Remove duplicates
	const otherVUniq = [];
	outer:
	for (let i=0; i<otherV.length; i++) {
		for (let j=0; j<otherVUniq.length; j++) {
			if (mag(sub(otherV[i], otherVUniq[j])) < 0.01) {
				continue outer;
			}
		}
		otherVUniq.push(otherV[i]);
	}
	// Average vs to get normal
	let avg = Vec(0,0,0);
	otherVUniq.forEach(v => {
		avg = add(avg, v);
	});
	avg = mul(avg, 1/otherVUniq.length);
	// Get outside point
	let nv = add(v, unit(sub(v, avg)));
	// Invert for concave holes
	if (neighborDistance(nv, nbrPipeds) < neighborDistance(v, nbrPipeds)) {
		const d = sub(v, nv);
		nv = add(nv, mul(d, 2));
	}
	// Get neighboring faces
	const faces = [];
	const facesUniq = [];
	nbrPipeds.forEach(pi => {
		pi.hulls.forEach(face => {
			// Check whether face contains two points
			let foundV = false;
			let foundOtherV = false;
			for (let i=0; i<face.points.length; i++) {
				if (mag(sub(face.points[i], v)) < 0.01) {
					foundV = true;
				}
				for (let j=0; j<otherVUniq.length; j++) {
					if (mag(sub(face.points[i], otherVUniq[j])) < 0.01) {
						foundOtherV = true;
						break;
					}
				}
			}
			if (!foundV || !foundOtherV) {
				return;
			}
			let found = false;
			for (let i=0; i<faces.length; i++) {
				if (face.equals(faces[i][0])) {
					faces[i][1]++;
					found = true;
				}
			}
			if (!found) {
				faces.push([face, 1]);
			}
		});
	});
	// Get unique faces
	for (let i=0; i<faces.length; i++) {
		if (faces[i][1] == 1) {
			facesUniq.push(faces[i][0]);
		}
	}
	// Construct new pipeds
	const npipeds = [];
	for (let i=0; i<facesUniq.length; i++) {
		const face = facesUniq[i];
		const points =[v, nv];
		outer:
		for (let j=0; j<face.points.length; j++) {
			for (let k=0; k<otherVUniq.length; k++) {
				if (mag(sub(face.points[j], otherVUniq[k])) < 0.01) {
					points.push(face.points[j]);
					continue outer;
				}
			}
		}
		npipeds.push(new Piped({points}));
	}
	return npipeds;
}

window.addEventListener('load', e => {
	/*testHulls();
	const hulls = [];
	hulls.push(new Hull2D({points: [Vec(0,0,0), Vec(1,0,0), Vec(0,1,0)]}));
	hulls.push(new Hull2D({points: [Vec(0,0,-1), Vec(1,0,-1), Vec(0,1,-1)]}));
	hulls.push(new Hull2D({points: [Vec(0,0,1), Vec(1,0,1), Vec(0,1,1)]}));
	hulls.push(new Hull2D({points: [Vec(1,1,0), Vec(1,2,0), Vec(2,2,0)]}));*/
	const pipeds = [];
	pipeds.push(new Piped({points: [Vec(0,0,0), Vec(1,0,0), Vec(0,1,0), Vec(0,0,1)]}));
	pipeds.push(new Piped({points: [Vec(1,0,0), Vec(1,1,0), Vec(1,0,1), Vec(2,0,0)]}));
	pipeds.push(new Piped({points: [Vec(-1,-0.5,1), Vec(-2,-0.4,1), Vec(-1,-1.4,1), Vec(-1,-0.4,2)]}));
	const canvas = $('#canvas');
	const camera = new Camera({canvas});
	let selectedVertex = null;
	let debugVs = pipeds[0].hulls[0].pointsInside;
	function repaint() {
		camera.clear();
		const hulls = [];
		pipeds.forEach(p => {
			p.hulls.forEach(h => {
				hulls.push(h);
			});
		});
		const sorted = orderHulls(hulls, camera);
		sorted.forEach(h => {
			h.draw({camera, fillStyle: 'red', strokeStyle: 'black'});
		});
		if (selectedVertex) {
			const p = camera.projectToScreen(selectedVertex);
			fillCircle(camera.ctx, p, 5, 'blue');
		}
		if (debugVs) {
			debugVs.forEach(v => {
				const p = camera.projectToScreen(v);
				fillCircle(camera.ctx, p, 5, 'green');
			});
		}
	}
	repaint();
	document.addEventListener('keydown', e => {
		if (e.key == 'ArrowUp') {
			camera.rotateAroundHorizontal(0.05);
		}
		if (e.key == 'ArrowDown') {
			camera.rotateAroundHorizontal(-0.05);
		}
		if (e.key == 'ArrowLeft') {
			camera.rotateAroundVertical(0.05);
		}
		if (e.key == 'ArrowRight') {
			camera.rotateAroundVertical(-0.05);
		}
		repaint();
	});
	let mouseCur = null;
	canvas.addEventListener('mousedown', e => {
		mouseCur = Point(e.offsetX, e.offsetY);
	});
	canvas.addEventListener('mouseup', e => {
		if (!mouseCur) return;
		// Click
		const newCur = Point(e.offsetX, e.offsetY);
		const delta = Point(newCur.x-mouseCur.x, newCur.y-mouseCur.y);
		if (mag(Vec(delta.x, delta.y, 0)) < 5) {
			selectedVertex = selectVertex(mouseCur, pipeds, camera);
			repaint();
		}
		// Stop rotating
		mouseCur = null;
	});
	canvas.addEventListener('mousemove', e => {
		if (!mouseCur) return;
		const newCur = Point(e.offsetX, e.offsetY);
		const delta = Point(newCur.x-mouseCur.x, newCur.y-mouseCur.y);
		mouseCur = newCur;
		const movex = 0.05*delta.x;
		const movey = 0.05*delta.y;
		camera.rotateAroundVertical(movex);
		camera.rotateAroundHorizontal(movey);
		repaint();
	});
	canvas.addEventListener('mouseleave', e => {
		mouseCur = null;
	});
	canvas.addEventListener('focusout', e => {
		mouseCur = null;
	});
	$('#bGenFromV').addEventListener('click', e => {
		if (!selectedVertex) return;
		const newPipeds = generatePipeds(selectedVertex, pipeds);
		if (!newPipeds) return;
		newPipeds.forEach(p => {
			pipeds.push(p);
		});
		selectedVertex = null;
		repaint();
	});
	/*console.log(pointInsidePolygon(Point(0,0), [Point(-1,-1), Point(-1,1), Point(1,1), Point(1,-1)]));
	console.log(pointInsidePolygon(Point(0.9,0), [Point(-1,-1), Point(-1,1), Point(1,1), Point(1,-1)]));
	console.log(pointInsidePolygon(Point(-2,0), [Point(-1,-1), Point(-1,1), Point(1,1), Point(1,-1)]));
	console.log(pointInsidePolygon(Point(0,0), [Point(-1,-0.5), Point(-1,0.5), Point(1,1), Point(1,-1)]));
	console.log(pointInsidePolygon(Point(0,1), [Point(-1,-0.5), Point(-1,0.5), Point(1,1), Point(1,-1)]));
	console.log(pointInsidePolygon(Point(0,-0.46), [Point(-1,-0.5), Point(-1,0.5), Point(1,1), Point(1,-0.4)]));*/
});

// 2D hulls ordered from back to front
// Invariant: hulls assumed not to cross each other
// All points in hulls assumed to lie on the same plane
function orderHulls(hulls,camera) {
	const uniq = [];
	outer:
	for (let i=0; i<hulls.length; i++) {
		for (let j=0; j<uniq.length; j++) {
			if (hulls[i].equals(uniq[j])) {
				continue outer;
			}
		}
		uniq.push(hulls[i]);
	}
	hulls = uniq;
	const occludes = hulls.map(h => []);
	for (let i=0; i<hulls.length; i++) {
		for (let j=i+1; j<hulls.length; j++) {
			if (hulls[i].occludes(hulls[j], camera)) {
				occludes[i].push(j);
			} else if (hulls[j].occludes(hulls[i], camera)) {
				occludes[j].push(i);;
			} 
		}
	}
	const sorted = hulls.map((h,i) => [h,i]);
	sorted.sort(function (a,b) {
		if (occludes[a[1]].includes(b[1])) {
			return 1;
		} else if (occludes[b[1]].includes(a[1])) {
			return -1;
		} else {
			return 0;
		}
	});
	return sorted.map(hi => hi[0]);
}

class Piped {
	constructor(params) {
		if (params.points.length != 4) {
			console.log("Bad number of points in Piped constructor");
		}
		// Deep copy
		this.points = params.points.map(p => Vec(p.x, p.y, p.z));
	}

	get sides() {
		const a = sub(this.points[1], this.points[0]);
		const b = sub(this.points[2], this.points[0]);
		const c = sub(this.points[3], this.points[0]);
		return [a, b, c];
	}

	// For generating pipeds
	// Each piped has 12 sides
	get sidePairs() {
		const pairs = []; 
		const [a, b, c] = this.sides;
		pairs.push([this.points[0], this.points[1]]);
		pairs.push([this.points[0], this.points[2]]);
		pairs.push([this.points[0], this.points[3]]);
		pairs.push([this.points[1], add(this.points[1], b)]);
		pairs.push([this.points[1], add(this.points[1], c)]);
		pairs.push([this.points[2], add(this.points[2], a)]);
		pairs.push([this.points[2], add(this.points[2], c)]);
		pairs.push([this.points[3], add(this.points[3], a)]);
		pairs.push([this.points[3], add(this.points[3], b)]);
		const fp = add(this.points[0], add(add(a, b), c));
		pairs.push([fp, sub(fp, a)]);
		pairs.push([fp, sub(fp, b)]);
		pairs.push([fp, sub(fp, c)]);
		return pairs;
	}

	get allPoints() {
		const points = [];
		this.points.forEach(p => points.push(p));
		const [a, b, c] = this.sides;
		const ds = [add(a, b), add(a, c), add(b, c), add(add(a, b), c)];
		ds.forEach(d => points.push(add(this.points[0], d)));
		return points;
	}

	get hulls() {
		const [a, b, c] = this.sides;
		const firstThree = [[a, b], [a, c], [b, c]];
		const secondThree = [[neg(a), neg(b)], [neg(a), neg(c)], [neg(b), neg(c)]];
		const firstStart = this.points[0];
		const secondStart = add(this.points[0], add(a, add(b, c)));
		const hulls = [];
		firstThree.forEach(pair => {
			const [a, b] = pair;
			const points = [];
			const sides = [Vec(0,0,0), a, add(a,b), b];
			sides.forEach(s => points.push(add(firstStart, s)));
			hulls.push(new Hull2D({points}));
		});
		secondThree.forEach(pair => {
			const [a, b] = pair;
			const points = [];
			const sides = [Vec(0,0,0), a, add(a,b), b];
			sides.forEach(s => points.push(add(secondStart, s)));
			hulls.push(new Hull2D({points}));
		});
		return hulls;
	}
}

// Hull class made up of point segments
// Invariant: should be 2D embedded in 3D
class Hull2D {
	constructor(params) {
		// Deep copy
		this.points = params.points.map(p => Vec(p.x, p.y, p.z));
	}

	draw(params) {
		const camera = params.camera;
		const ctx = camera.ctx;
		const fillStyle = params.fillStyle ?? null;
		const strokeStyle = params.strokeStyle ?? null;
		const points = this.points.map(p => camera.projectToScreen(p));
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i=1; i<=points.length; i++) {
			const j = i%points.length;
			ctx.lineTo(points[j].x, points[j].y);
		}
		if (fillStyle) {
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}
		if (strokeStyle) {
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();
		}
		ctx.restore();
	}

	equals(hull) {
		outer:
		for (let i=0; i<this.points; i++) {
			for (let j=0; j<hull.points; j++) {
				if (dist(this.points[i], hull.points[j]) < 0.01) {
					continue outer;
				}
			}
			return false;
		}
		return true;
	}

	get plane() {
		if (this.points.length < 3) {
			console.log("Bad in get plane() npoints");
			return null;
		}
		const p01 = sub(this.points[0], this.points[1]);
		const eps = 1e-5;
		let normal = null;
		for (let i=2; i<this.points.length; i++) {
			const p0i = sub(this.points[0], this.points[i]);
			const cp = cross(p01, p0i);
			if (mag(cp) > eps) {
				normal = cp;
				break;
			}
		}
		if (normal == null) {
			console.log("Bad in get plane() normal");
			return null;
		}
		const p0 = this.points[0];
		return Plane(Vec(normal.x, normal.y, normal.z), Vec(p0.x, p0.y, p0.z));
	}

	equals(hull) {
		let numFound = 0;
		for (let i=0; i<this.points.length; i++) {
			for (let j=0; j<hull.points.length; j++) {
				if (mag(sub(this.points[i], hull.points[j])) < 0.01) {
					numFound++;
					break;
				}
			}
		}
		return numFound == this.points.length && numFound == hull.points.length;
	}

	// Assume points are ordered
	contains(point) {
		const cps = [];
		for (let i=0; i<this.points.length; i++) {
			const j = (i+1)%this.points.length;
			const cp = cross(sub(this.points[i], point), sub(this.points[j], this.points[i]));
			cps.push(cp);
		}
		for (let i=0; i<cps.length; i++) {
			if (dot(cps[0], cps[i]) < 0) {
				return false;
			}
		}
		return true;
	}

	get pointsInside() {
		const da = mul(sub(this.points[1], this.points[0]), 1/26);
		const db = mul(sub(this.points[3], this.points[0]), 1/26);
		const points = [];
		for (let i=1; i<=25; i+=8) {
			const a = mul(da, i);
			for (let j=1; j<=25; j+=8) {
				const b = mul(db, j);
				const p = add(this.points[0], add(a, b));
				points.push(p);
			}
		}
		return points;
	}

	occludes(other, camera) {
		const otherPlane = other.plane;
		const pointsInside = this.pointsInside;
		for (let i=0; i<pointsInside.length; i++) {
			const p = pointsInside[i];
			const t = lineIntersectsPlane(camera.eye, p, otherPlane);
			const pp = add(p, mul(sub(p, camera.eye), t));
			if (other.contains(pp)) {
				return t > 0;
			}
		}
		let distMe = 0;
		let distOther = 0;
		this.points.forEach(p => {
			distMe += mag(sub(p, camera.eye));
		});
		other.points.forEach(p => {
			distOther += mag(sub(p, camera.eye));
		});
		return distMe < distOther;
	}
}

/*function generateParts(n) {
	const parts = [];
	let sum = 0;
	for (let i=0; i<n; i++) {
		parts.push(Math.random());
		sum += parts.at(-1);
	}
	for (let i=0; i<n; i++) {
		parts[i] = parts[i]/sum;
	}
	return parts;
}*/

// A horizontal ray from point p crosses the line segment defined by p0 and p1
function rayCrossesLine(p, p1, p2) {
	const mex = p.x;
	const mey = p.y;
	const o1x = p1.x;
	const o1y = p1.y;
	const o2x = p2.x;
	const o2y = p2.y;
	if (mey == o1y) {
		if (mex < o1x) {
			return true;
		}
	} else if (mey == o2y) {
		if (mex < o2x) {
			return true;
		}
	} else if ((mey > o1y && mey < o2y) || (mey > o2y && mey < o1y)) {
		const dx = o2x-o1x;
		const dy = o2y-o1y;
		const dyp = mey-o1y;
		const dxp = dyp*dx/dy;
		const xp = mex-dxp;
		if (xp < o1x) {
			return true;
		}
	}
	return false;
}

function pointInsidePolygon(p, points) {
	let inter = 0;
	for (let i=0; i<points.length; i++) {
		const j = (i+1)%points.length;
		if (rayCrossesLine(p, points[i], points[j])) {
			inter++;
		}
	}
	return (inter % 2) == 1;
}

class Camera {
	constructor(params) {
		this.eye = params.eye ?? Vec(0, 0, 5);
		this.c = params.c ?? Vec(0, 0, 4);
		this.h = params.h ?? Vec(0, 1, 4);
		this.canvas = params.canvas;
		this.ctx = this.canvas.getContext('2d');
		this.recalc();
	}

	clear() {
		this.ctx.save();
		this.ctx.fillStyle = '#fff';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.restore();
	}

	// TODO: reformulate in terms of vector functions
	project(p) {
		const a = sub(p, this.eye);
		const b = sub(this.eye, this.c);
		const t = -(b.x*b.x + b.y*b.y + b.z*b.z) / (a.x*b.x + a.y*b.y + a.z*b.z);
		if (t <= 0) {
			return null;
		}
		const q = add(mul(a, t), this.eye);
		return q;
	}

	projectToScreen(p) {
		p = this.project(p);
		if (p == null) {
			return null;
		}
		p = sub(p, this.c);
		const y = dot(p, this.hc)*this.canvas.height;
		const x = dot(p, this.wc)*this.canvas.height;
		// Change to canvas coords
		const xx = this.canvas.width/2 + x;
		const yy = this.canvas.height/2 - y;
		return Point(xx, yy);
	}

	projectToCenterPlane(p) {
		const pl = Plane(Vec(this.eye.x, this.eye.y, this.eye.z), Vec(0,0,0));
		const t = lineIntersectsPlane(this.eye, p, pl);
		const cp = add(mul(sub(p, this.eye), t), this.eye);
		return cp;
	}

	recalc() {
		// Calculate w direction
		// Unit vectors in the "y axis" (hc) and "x axis" (wc)
		this.hc = unit(sub(this.h, this.c));
		this.ec = unit(sub(this.eye, this.c));
		this.wc = cross(this.hc, this.ec);
	}

	// Rotate point b theta degrees around the axis c 
	// c assumed to start from (0,0,0)
	rotate(b, c, theta) {
		const bc = cross(b, c);
		const t = Math.tan(theta)*mag(b)/mag(bc);
		const tbc = mul(cross(b, c), t);
		const btbc = add(b, tbc);
		const s = mag(b)/mag(btbc);
		const res = mul(btbc, s);
		return res;
	}

	rotateAroundHorizontal(theta) {
		const cp = this.projectToCenterPlane(add(this.c, this.wc));
		this.eye = this.rotate(this.eye, cp, theta);
		this.c = this.rotate(this.c, cp, theta);
		this.h = this.rotate(this.h, cp, theta);
		this.recalc();
	}

	rotateAroundVertical(theta) {
		const cp = this.projectToCenterPlane(this.h);
		this.eye = this.rotate(this.eye, cp, theta);
		this.c = this.rotate(this.c, cp, theta);
		this.h = this.rotate(this.h, cp, theta);
		this.recalc();
	}
}

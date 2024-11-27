
import {$, $$} from "./util.js";

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

window.addEventListener('load', e => {
	testHulls();
	const hulls = [];
	hulls.push(new Hull2D({points: [Vec(0,0,0), Vec(1,0,0), Vec(0,1,0)]}));
	hulls.push(new Hull2D({points: [Vec(0,0,-1), Vec(1,0,-1), Vec(0,1,-1)]}));
	hulls.push(new Hull2D({points: [Vec(0,0,1), Vec(1,0,1), Vec(0,1,1)]}));
	const camera = new Camera({canvas: $('#canvas')});
	function repaint() {
		camera.clear();
		const sorted = orderHulls(hulls, camera);
		sorted.forEach(h => {
			h.draw({camera, fillStyle: 'red', strokeStyle: 'black'});
		});
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
});

// 2D hulls ordered from back to front
// Invariant: hulls assumed not to cross each other
// All points in hulls assumed to lie on the same plane
function orderHulls(hulls, camera) {
	const occluders = hulls.map(h => 0);
	for (let i=0; i<hulls.length; i++) {
		for (let j=i+1; j<hulls.length; j++) {
			if (hulls[i].occludes(hulls[j], camera)) {
				occluders[i]++;
			} else if (hulls[j].occludes(hulls[i], camera)) {
				occluders[j]++;
			} else {
				// Dirty hack because sometimes i doesn't occlude j and j doesn't occlude i
				// Seems to work so far
				occluders[i]++;
			}
		}
	}
	const sorted = hulls.map(h => 0);
	for (let i=0; i<occluders.length; i++) {
		sorted[occluders[i]] = hulls[i];
	}
	return sorted;
}

// Hull class made up of point segments
// Invariant: should be 2D embedded in 3D
class Hull2D {
	constructor(params) {
		// Deep copy
		const points = params.points;
		this.points = points.map(p => Vec(p.x, p.y, p.z));
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

	occludes(hull, camera, log) {
		const eps = 1e-5;
		// Remove vertices which are approximately equal for the two hulls
		// To prevent approximation errors
		const testPoints = [];
		for (let i=0; i<this.points.length; i++) {
			let eq = false;
			for (let j=0; j<hull.points.length; j++) {
				if (dist(this.points[i], hull.points[j]) < eps) {
					eq = true;
					break;
				}
			}
			if (!eq) {
				testPoints.push(this.points[i]);
			}
		}
		const ts = testPoints.map(p => lineIntersectsPlane(camera.eye, p, hull.plane));
		if (log) {
			console.log(camera.eye);
			console.log(testPoints[0]);
			console.log(hull.plane);
			console.log(ts);
		}
		// Sanity check that hulls do not cross
		outer:
		for (let i=0; i<ts.length; i++) {
			for (let j=i+1; j<ts.length; j++) {
				if (ts[i]*ts[j] < 0) {
					console.log("Colliding hulls in Hull2D.occludes()");
					break outer;
				}
			}
		}
		return ts[0] > 0;
	}
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

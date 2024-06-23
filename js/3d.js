
export {Vec, Point, Line, Plane, Piped, Camera, dist, linePointDistance, getConvexHull};

function Point(x, y) {
	return {x, y};
}

function Vec(x, y, z) {
	return {x, y, z};
}

function Plane(a, b, c) {
	return {a, b, c};
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

function rotz(a, theta) {
	const x = Math.cos(theta)*a.x - Math.sin(theta)*a.y;
	const y = Math.sin(theta)*a.x + Math.cos(theta)*a.y;
	return Vec(x, y, a.z);
}

function rotx(a, theta) {
	const y = Math.cos(theta)*a.y - Math.sin(theta)*a.z;
	const z = Math.sin(theta)*a.y + Math.cos(theta)*a.z;
	return Vec(a.x, y, z);
}

function roty(a, theta) {
	const z = Math.cos(theta)*a.z - Math.sin(theta)*a.x;
	const x = Math.sin(theta)*a.z + Math.cos(theta)*a.x;
	return Vec(x, a.y, z);
}

// Looking from b toward s (b is eye and s is point on the viewing plane)
function linePointDistance(b, s, p) {
	const a = sub(s, b);
	const A = a.x*a.x + a.y*a.y + a.z*a.z;
	const B = 2*a.x*b.x + 2*a.y*b.y + 2*a.z*b.z 
		- (s.x+p.x)*a.x - (s.y+p.y)*a.y - (s.z+p.z)*a.z;
	const C = s.x*p.x + s.y*p.y + s.z*p.z 
		+ b.x*b.x + b.y*b.y + b.z*b.z 
		- (s.x+p.x)*b.x - (s.y+p.y)*b.y - (s.z+p.z)*b.z;
	const t1 = (-B + Math.sqrt(B*B - 4*A*C)) / (2*A);
	const t2 = (-B - Math.sqrt(B*B - 4*A*C)) / (2*A);
	let d1 = Infinity;
	let d2 = Infinity;
	if (t1 >= 0) {
		const c = add(mul(a, t1), b);
		d1 = dist(c, p);
	}
	if (t2 >= 0) {
		const c = add(mul(a, t2), b);
		d2 = dist(c, p);
	}
	if (d2 < d1) {
		return d2;
	}
	return d1;
}

function getConvexHull(ps) {
	let a = 0;
	let b = 0;
	init:
	for (let i=0; i<ps.length; i++) {
		for (let j=i+1; j<ps.length; j++) {
			let cp = null;
			for (let k=j+1; k<ps.length; k++) {
				const mycp = cross(sub(ps[k], ps[j]), sub(ps[j], ps[i]));
				if (cp == null) {
					cp = mycp;
					continue;
				}
				if (dot(cp, mycp) < 0) {
					continue init;
				}
			}
			a = i;
			b = j;
			break init;
		}
	}
	const edges = [new Line(ps[a], ps[b])];
	for (let k=0; k<ps.length-1; k++) {
		let found = false;
		outer:
		for (let i=0; i<ps.length; i++) {
			const cp = cross(sub(ps[i], ps[b]), sub(ps[b], ps[a]));
			if (i == b || i == a) {
				continue;
			}
			for (let j=0; j<ps.length; j++) {
				if (j == i || j == b || j == a) {
					continue;
				}
				const mycp = cross(sub(ps[j], ps[i]), sub(ps[i], ps[b]));
				if (dot(cp, mycp) < 0) {
					continue outer;
				}
			}
			edges.push(new Line(ps[b], ps[i]));
			a = b;
			b = i;
			found = true;
			break;
		}
		if (!found) {
			break;
		}
	}
	return edges;
}

class Piped {
	constructor(c, x, y, z) {
		this.c = c;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	get center() {
		const vs = this.vertices;
		let c = Vec(0,0,0);
		vs.forEach(v => {
			c = add(c, v);
		});
		return mul(c, 1/8);
	}

	getCrossSection(pl) {
		const ps = [];
		this.edges.forEach(e => {
			const p = e.intersectPlane(pl);
			if (p != null) {
				ps.push(p);
			}
		});
		if (ps.length < 3) {
			return [];
		}
		return getConvexHull(ps);
	}

	draw(camera) {
		this.edges.forEach(e => {
			e.draw(camera);
		});
	}

	drawCrossSection(camera, pl) {
		const cs = this.getCrossSection(pl);
		if (!cs) {
			return;
		}
		cs.forEach(e => {
			e.draw(camera, '#f00');
		});
	}

	get edges() {
		const edges = [];
		const xc = sub(this.x, this.c);
		const yc = sub(this.y, this.c);
		const zc = sub(this.z, this.c);
		const c2 = add(add(add(this.c, xc), yc), zc);
		edges.push(new Line(this.c, this.x));
		edges.push(new Line(this.c, this.y));
		edges.push(new Line(this.c, this.z));
		edges.push(new Line(this.x, add(this.x, yc)));
		edges.push(new Line(this.x, add(this.x, zc)));
		edges.push(new Line(this.y, add(this.y, xc)));
		edges.push(new Line(this.y, add(this.y, zc)));
		edges.push(new Line(this.z, add(this.z, xc)));
		edges.push(new Line(this.z, add(this.z, yc)));
		edges.push(new Line(c2, add(c2, neg(xc))));
		edges.push(new Line(c2, add(c2, neg(yc))));
		edges.push(new Line(c2, add(c2, neg(zc))));
		return edges;
	}

	genPipedsFromVertex(v1) {
		const c = this.center;
		const v2 = add(v1, sub(v1, c));
		// Get neighbors
		const ns = [];
		this.edges.forEach(e => {
			if (dist(v1, e.a) < 0.01) {
				ns.push(e.b);
			} else if (dist(v1, e.b) < 0.01) {
				ns.push(e.a);
			}
		});
		const pipeds = [
			new Piped(v1, v2, ns[0], ns[1]),
			new Piped(v1, v2, ns[0], ns[2]),
			new Piped(v1, v2, ns[1], ns[2])
		];
		return pipeds;
	}

	rot(rot, theta) {
		this.c = rot(this.c, theta);
		this.x = rot(this.x, theta);
		this.y = rot(this.y, theta);
		this.z = rot(this.z, theta);
	}

	rotx(theta) {
		this.rot(rotx, theta);
	}

	rotz(theta) {
		this.rot(rotz, theta);
	}

	roty(theta) {
		this.rot(roty, theta);
	}

	get vertices() {
		const xc = sub(this.x, this.c);
		const yc = sub(this.y, this.c);
		const zc = sub(this.z, this.c);
		const vs = [this.c, this.x, this.y, this.z];
		vs.push(add(this.x, yc));
		vs.push(add(this.x, zc));
		vs.push(add(this.z, yc));
		vs.push(add(add(this.z, yc), xc));
		return vs;
	}
}

class Line {
	constructor(a, b) {
		this.a = a;
		this.b = b;
	}

	// TODO: if only one of a or b projection is null, replace with correct ending point
	draw(camera, color) {
		color = color ?? '#000';
		const a = camera.projectToScreen(this.a);
		const b = camera.projectToScreen(this.b);
		if (a == null || b == null) {
			return;
		}
		const ctx = camera.ctx;
		ctx.save();
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(a.x, a.y);
		ctx.lineTo(b.x, b.y);
		ctx.stroke();
		ctx.restore();
	}

	// t valid between 0 and 1
	intersectPlane(pl) {
		const q = this.a;
		const p = sub(this.b, this.a);
		const t = (1 - (pl.a*q.x + pl.b*q.y + pl.c*q.z)) / (pl.a*p.x + pl.b*p.y + pl.c*p.z);
		if (t < 0 || t > 1 || isNaN(t)) {
			return null;
		}
		return add(mul(p, t), q)
	}
}

class Camera {
	constructor(params) {
		this.eye = params.eye ?? Vec(5, 0, 0);
		this.c = params.c ?? Vec(4, 0, 0);
		this.h = params.h ?? Vec(4, 0, 1);
		this.canvas = params.canvas;
		this.ctx = this.canvas.getContext('2d');
		// Calculate w direction
		// Unit vectors in the "y axis" (hc) and "x axis" (wc)
		this.hc = unit(sub(this.h, this.c));
		this.ec = unit(sub(this.eye, this.c));
		this.wc = cross(this.hc, this.ec);
	}

	clear() {
		this.ctx.save();
		this.ctx.fillStyle = '#fff';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.restore();
	}

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

	screenToWorld(p) {
		const x = (p.x-this.canvas.width/2)/this.canvas.height;
		const y = (this.canvas.height/2-p.y)/this.canvas.height;
		p = add(mul(this.hc, y), mul(this.wc, x));
		p = add(this.c, p);
		return p;
	}
}

export {$, $$, make2dArray, fillCircle, drawText};

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

function make2dArray(m, n, val) {
	const arr = [];
	for (let i=0; i<m; i++) {
		arr.push([]);
		for (let j=0; j<n; j++) {
			arr.at(-1).push(val);
		}
	}
	return arr;
}

function fillCircle(ctx, c, r, color) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function drawText(ctx, text, p, color, font, stroke) {
    ctx.save();
    if (font) ctx.font = font;
    const tm = ctx.measureText(text);
    ctx.fillStyle = color;
    if (p.ljust) 
        ctx.fillText(text, p.x, p.y);
    else if (p.rjust)
        ctx.fillText(text, p.x-tm.width, p.y);   
    else
        ctx.fillText(text, p.x-tm.width/2, p.y);
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.strokeText(text, p.x-tm.width/2, p.y);
    }
    ctx.restore();
    return tm;
}

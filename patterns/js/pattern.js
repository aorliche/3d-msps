
const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

window.addEventListener('load', _ => {
	const stripeColor = $('#stripeColor');
	const stripeColorWidth = $('#stripeColorWidth');
	const stripeBlankWidth = $('#stripeBlankWidth');
	const stripeAngle = $('#stripeAngle');
	const dotColor = $('#dotColor');
	const dotSize = $('#dotSize');
	const dotSpacing = $('#dotSpacing');
	const dotAngle = $('#dotAngle');
	const canvas = $('#canvas');
	const ctx = canvas.getContext('2d');

	function makeStripe(stripesOrDots) {
		let col = stripesOrDots == 'stripes' ? 
			stripeColor.value : dotColor.value;
		const cw = parseInt(stripeColorWidth.value);
		const bw = parseInt(stripeBlankWidth.value);
		const theta = stripesOrDots == 'stripes' ? 
			parseInt(stripeAngle.value) : parseInt(dotAngle.value);

		const ds = parseInt(dotSize.value);
		const dp = parseInt(dotSpacing.value);

		col = col.split(",").map(c => c.trim());

		ctx.save();
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.rotate(theta*Math.PI/180);
		if (stripesOrDots == 'stripes') {
			for (let i=0; (i*(cw+bw)) < canvas.height*4; i++) {
				ctx.fillStyle = col[i % col.length];
				ctx.fillRect(-2*canvas.width, i*(cw+bw)-2*canvas.height, 4*canvas.width, cw);
			}
		} else {
			for (let i=0; (i*dp) < canvas.height*4; i++) {
				for (let j=0; (j*dp) < canvas.width*4; j++) {
					ctx.fillStyle = col[(i+j) % col.length];
					ctx.beginPath();
					ctx.arc(j*dp-2*canvas.width, i*dp-2*canvas.height, ds, 0, 2*Math.PI);
					ctx.fill();
				}
			}

		}
		ctx.restore();

		canvas.toBlob((blob) => {
			const url = URL.createObjectURL(blob);

			$('#stripePreview').onload = () => {
				URL.revokeObjectURL(url);
			};

			$('#stripePreview').src = url;
		});
	}

	makeStripe('stripes');

	[stripeColor, stripeColorWidth, stripeBlankWidth, stripeAngle].forEach(inp => {
		inp.addEventListener('input', () => makeStripe('stripes'));
	});

	[dotColor, dotSize, dotSpacing, dotAngle].forEach(inp => {
		inp.addEventListener('input', () => makeStripe('dots'));
	});
});

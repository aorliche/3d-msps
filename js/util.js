export {$, $$, make2dArray};

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

const cubeView = document.querySelector("#cube-view");
const stage = document.querySelector("#stage");
const moveCount = document.querySelector("#move-count");
const timerElement = document.querySelector("#timer");

const colors = { U: "white", D: "yellow", F: "red", B: "orange", L: "blue", R: "green" };
const keyMoves = { A: "U", Z: "D", E: "L", Q: "R", S: "F", D: "B", W: "M", X: "E", C: "S" };
const moveDefinitions = {
	U: { axis: "y", layer: 1, direction: 1 }, D: { axis: "y", layer: -1, direction: -1 },
	F: { axis: "z", layer: 1, direction: -1 }, B: { axis: "z", layer: -1, direction: 1 },
	L: { axis: "x", layer: -1, direction: -1 }, R: { axis: "x", layer: 1, direction: 1 },
	M: { axis: "x", layer: 0, direction: -1 }, E: { axis: "y", layer: 0, direction: -1 }, S: { axis: "z", layer: 0, direction: -1 },
};
const normals = ["U", "D", "F", "B", "L", "R"];
const cubies = [];
const cubieSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cubie"));
let viewRotation = { x: -24, y: -34 };
let moves = 0;
let startedAt = null;
let timerId = null;
let busy = false;
let lastMove = null;

const rotateVector = ([x, y, z], axis, direction) => {
	if (axis === "x") return direction === 1 ? [x, -z, y] : [x, z, -y];
	if (axis === "y") return direction === 1 ? [z, y, -x] : [-z, y, x];
	return direction === 1 ? [-y, x, z] : [y, -x, z];
};

function createCubies() {
	for (let x = -1; x <= 1; x += 1) {
		for (let y = -1; y <= 1; y += 1) {
			for (let z = -1; z <= 1; z += 1) {
				const stickers = {};
				if (y === 1) stickers.U = colors.U;
				if (y === -1) stickers.D = colors.D;
				if (z === 1) stickers.F = colors.F;
				if (z === -1) stickers.B = colors.B;
				if (x === -1) stickers.L = colors.L;
				if (x === 1) stickers.R = colors.R;
				cubies.push({ position: [x, y, z], stickers, element: null });
			}
		}
	}
}

function setCubeTransform() { cubeView.style.transform = `rotateX(${viewRotation.x}deg) rotateY(${viewRotation.y}deg)`; }

function positionStyle([x, y, z]) {
	return `translate3d(${x * cubieSize}px, ${-y * cubieSize}px, ${z * cubieSize}px)`;
}

function animatedPosition([x, y, z], axis, layer, angle) {
	const radians = angle * Math.PI / 180;
	const cosine = Math.cos(radians);
	const sine = Math.sin(radians);
	if (axis === "x") [y, z] = [y * cosine - z * sine, y * sine + z * cosine];
	if (axis === "y") [x, z] = [x * cosine + z * sine, -x * sine + z * cosine];
	if (axis === "z") [x, y] = [x * cosine - y * sine, x * sine + y * cosine];
	return positionStyle([axis === "x" ? layer : x, axis === "y" ? layer : y, axis === "z" ? layer : z]);
}

function renderCube() {
	cubeView.replaceChildren();
	cubies.forEach((cubie) => {
		const element = document.createElement("div");
		element.className = "cubie";
		element.style.transform = positionStyle(cubie.position);
		normals.forEach((normal) => {
			if (!cubie.stickers[normal]) return;
			const sticker = document.createElement("span");
			sticker.className = `sticker ${normal === "U" ? "top" : normal === "D" ? "bottom" : normal === "F" ? "front" : normal === "B" ? "back" : normal === "L" ? "left" : "right"} color-${cubie.stickers[normal]}`;
			if (normal === highlightedFace) sticker.classList.add("turn-highlight");
			sticker.addEventListener("pointerenter", () => setFaceHighlight(normal));
			sticker.addEventListener("pointerleave", () => {
				if (pointer?.mode !== "layer") setFaceHighlight(null);
			});
			sticker.addEventListener("pointerdown", (event) => {
				event.stopPropagation();
				pointer = { x: event.clientX, y: event.clientY, mode: "layer", face: normal };
				setFaceHighlight(normal);
				stage.classList.add("dragging");
				stage.setPointerCapture(event.pointerId);
			});
			element.appendChild(sticker);
		});
		cubie.element = element;
		cubeView.appendChild(element);
	});
	setCubeTransform();
}

function updateStats() {
	moveCount.textContent = String(moves).padStart(2, "0");
	if (!startedAt) return;
	const seconds = Math.floor((Date.now() - startedAt) / 1000);
	timerElement.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function startTimer() { if (startedAt) return; startedAt = Date.now(); timerId = window.setInterval(updateStats, 1000); }

function applyMove(move, animate = true) {
	if (busy) return;
	const base = move[0].toUpperCase();
	const definition = moveDefinitions[base];
	if (!definition) return;
	const prime = move.includes("'");
	const double = move.includes("2");
	const { axis, layer } = definition;
	let direction = definition.direction;
	if (prime) direction *= -1;
	const selected = cubies.filter((cubie) => cubie.position["xyz".indexOf(axis)] === layer);
	const turns = double ? 2 : 1;
	lastMove = move;
	startTimer();
	busy = animate;
	const finishMove = () => {
		for (let turn = 0; turn < turns; turn += 1) {
			selected.forEach((cubie) => {
				cubie.position = rotateVector(cubie.position, axis, direction);
				const stickers = {};
				Object.entries(cubie.stickers).forEach(([normal, color]) => {
					const vector = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], L: [-1, 0, 0], R: [1, 0, 0] }[normal];
					const next = rotateVector(vector, axis, direction);
					const nextNormal = Object.keys({ U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], L: [-1, 0, 0], R: [1, 0, 0] }).find((key) => JSON.stringify({ U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], L: [-1, 0, 0], R: [1, 0, 0] }[key]) === JSON.stringify(next));
					stickers[nextNormal] = color;
				});
				cubie.stickers = stickers;
			});
		}
		moves += 1;
		busy = false;
		renderCube();
		updateStats();
	};
	if (!animate) {
		finishMove();
		return;
	}
	const duration = 300 * turns;
	const started = performance.now();
	const animateLayer = (now) => {
		const progress = Math.min((now - started) / duration, 1);
		const eased = 1 - Math.pow(1 - progress, 3);
		selected.forEach((cubie) => {
			const angle = direction * 90 * turns * eased;
			const visualAngle = angle * (axis === "y" ? 1 : -1);
			cubie.element.style.transform = `${animatedPosition(cubie.position, axis, layer, angle)} rotate${axis.toUpperCase()}(${visualAngle}deg)`;
		});
		if (progress < 1) window.requestAnimationFrame(animateLayer);
		else finishMove();
	};
	window.requestAnimationFrame(animateLayer);
}

function scramble() {
	if (busy) return;
	const faces = Object.keys(colors);
	let previous = "";
	let sequence = [];
	for (let index = 0; index < 20; index += 1) {
		let face = faces[Math.floor(Math.random() * faces.length)];
		while (face === previous) face = faces[Math.floor(Math.random() * faces.length)];
		previous = face;
		sequence.push(face + (Math.random() > .5 ? "'" : ""));
	}
	let index = 0;
	const next = () => { if (index < sequence.length) { applyMove(sequence[index], false); index += 1; window.setTimeout(next, 25); } };
	next();
}

document.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => applyMove(button.dataset.move)));
document.querySelector("#scramble").addEventListener("click", scramble);
document.querySelector("#reset").addEventListener("click", () => window.location.reload());
document.addEventListener("keydown", (event) => {
	if (event.key === "2" && lastMove) {
		event.preventDefault();
		applyMove(`${lastMove[0]}2`);
		return;
	}
	const move = keyMoves[event.key.toUpperCase()];
	if (!move) return;
	event.preventDefault();
	applyMove(`${move}${event.shiftKey ? "'" : ""}`);
});

let pointer = null;
let highlightedFace = null;
const stickerFaces = { front: "F", back: "B", top: "U", bottom: "D", left: "L", right: "R" };
function setFaceHighlight(face) {
	highlightedFace = face;
	const faceClass = Object.keys(stickerFaces).find((name) => stickerFaces[name] === face);
	cubeView.querySelectorAll(".sticker").forEach((sticker) => {
		sticker.classList.toggle("turn-highlight", Boolean(faceClass && sticker.classList.contains(faceClass)));
	});
}

document.addEventListener("pointerdown", (event) => {
	if (!stage.contains(event.target)) return;
	const sticker = event.target.closest && event.target.closest(".sticker");
	const stickerClass = sticker && Object.keys(stickerFaces).find((face) => sticker.classList.contains(face));
	const face = stickerFaces[stickerClass] || null;
	pointer = { x: event.clientX, y: event.clientY, mode: face ? "layer" : "view", face };
}, true);
stage.addEventListener("pointerdown", (event) => {
	const sticker = event.target.closest(".sticker");
	const stickerClass = sticker && Object.keys(stickerFaces).find((face) => sticker.classList.contains(face));
	const face = stickerFaces[stickerClass] || null;
	pointer = { x: event.clientX, y: event.clientY, mode: face ? "layer" : "view", face };
	stage.classList.add("dragging");
	stage.setPointerCapture(event.pointerId);
});
document.addEventListener("pointermove", (event) => {
	if (!pointer) return;
	const deltaX = event.clientX - pointer.x;
	const deltaY = event.clientY - pointer.y;
	if (pointer.mode === "layer") {
		if (Math.hypot(deltaX, deltaY) < 10 || busy) return;
		const positive = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX > 0 : deltaY < 0;
		applyMove(`${pointer.face}${positive ? "" : "'"}`);
		pointer = null;
		return;
	}
	viewRotation.y += deltaX * .55;
	viewRotation.x -= deltaY * .55;
	pointer = { ...pointer, x: event.clientX, y: event.clientY };
	setCubeTransform();
});
document.addEventListener("pointerup", (event) => {
	pointer = null;
	stage.classList.remove("dragging");
	const sticker = document.elementFromPoint(event.clientX, event.clientY)?.closest(".sticker");
	const stickerClass = sticker && Object.keys(stickerFaces).find((face) => sticker.classList.contains(face));
	setFaceHighlight(stickerFaces[stickerClass] || null);
});

createCubies();
renderCube();
updateStats();

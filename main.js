const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sprites = new Image();

window.innerWidth;
canvas.width = window.innerWidth > 800 ? window.innerWidth * 0.7 : 800;
canvas.height = 300;

sprites.src = "sprites.png";

let gameSpeed = 10;
let ticks = 0;
let score = 0;
let gameState = "menu"; //menu || game || gameOver
let bestScore = 0;

//Board
const floor = {
	sx: 0,
	sy: 104,
	sWidth: 2397,
	sHeight: 26,
	dx: 0,
	dy: canvas.height - 40,
	dWidth: 2397,
	dHeight: 26,
};

//Entities
const dino = {
	sx: 1338,
	sy: 2,
	sWidth: 88,
	sHeight: 96,
	dx: 10,
	dy: canvas.height - 96,
	dWidth: 88,
	dHeight: 96,
	gravity: 1.5,
	yVel: 0,

	//sx for others sprites:
	firstStepSx: 1514,
	secondStepSx: 1602,
	jumpSx: 1338,
	deadSx: 1690,
};

//Cacti
class Cactus {
	constructor(dx) {
		this.sx = 446;
		this.sy = 2;
		this.sWidth = 34;
		this.sHeight = 70;
		this.dx = dx || canvas.width;
		this.dy = canvas.height - 80;
		this.dWidth = 34;
		this.dHeight = 70;
		this.passed = false;
	}
}

class TallCactus extends Cactus {
	constructor(dx) {
		super(dx);
		this.sx = 752;
		this.sWidth = 51;
		this.sHeight = 101;
		this.dWidth = 41;
		this.dHeight = 101;
		this.dy = canvas.height - 100;
	}
}
class TripleCactus extends Cactus {
	constructor(dx) {
		super(dx);
		this.sx = 850;
		this.sWidth = 103;
		this.sHeight = 101;
		this.dWidth = 103;
		this.dHeight = 101;
		this.dy = canvas.height - 100;
	}
}

//Board logic
let firstFloorPos = 0;
let secondFloorPos = 2397;

function drawBoard() {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	firstFloorPos -= gameSpeed;
	secondFloorPos -= gameSpeed;
	ctx.drawImage(
		sprites,
		floor.sx,
		floor.sy,
		floor.sWidth,
		floor.sHeight,
		firstFloorPos,
		floor.dy,
		floor.dWidth,
		floor.dHeight
	);
	ctx.drawImage(
		sprites,
		floor.sx,
		floor.sy,
		floor.sWidth,
		floor.sHeight,
		secondFloorPos,
		floor.dy,
		floor.dWidth,
		floor.dHeight
	);

	if (firstFloorPos <= -floor.dWidth) firstFloorPos = floor.sWidth;

	if (secondFloorPos <= -floor.dWidth) secondFloorPos = floor.sWidth;

	ctx.fillStyle = "black";
	ctx.font = "20px Comic Sans MS";
	ctx.fillText(Math.floor(score), canvas.width - 100, 30);
	ctx.fillText("Best: " + Math.floor(bestScore), canvas.width - 300, 30);
}

//Cacti logic
let cacti = [new Cactus()];
const GAP = 500;
function generateCactus() {
	if (gameState === "gameOver") return;
	if (cacti.length > 10) {
		while (cacti[0].dx + cacti[0].dWidth < 0) {
			cacti.shift();
		}
		return;
	}
	const lastCactusPos = cacti[cacti.length - 1].dx;
	const randomDistance = lastCactusPos + GAP + getRandomNum(0, 400);
	const doubleChance = getRandomNum(1, 10) <= 2; //20%

	function pickCactus(distance) {
		const randomNum = getRandomNum(1, 10);

		if (randomNum <= 2 && !doubleChance) {
			return new TripleCactus(distance);
		}

		if (randomNum <= 5) {
			return new TallCactus(distance);
		}

		return new Cactus(distance);
	}

	if (doubleChance) {
		cacti.push(pickCactus(lastCactusPos + 30));
	}

	if (lastCactusPos >= GAP) {
		cacti.push(pickCactus(randomDistance));
	}
}

setInterval(generateCactus, 500);
function drawCacti() {
	if (cacti.length < 5) return;
	for (let i = 0; i < cacti.length; i++) {
		let cactus = cacti[i];
		if (cactus.dx + cactus.dWidth < 0) {
			continue;
		}
		if (gameState === "game") {
			cactus.dx -= gameSpeed;
		}
		ctx.drawImage(
			sprites,
			cactus.sx,
			cactus.sy,
			cactus.sWidth,
			cactus.sHeight,
			cactus.dx,
			cactus.dy,
			cactus.dWidth,
			cactus.dHeight
		);
	}
}

//Dino logic
let isJumping = dino.dy < canvas.height - dino.dHeight;

function jump(e) {
	if (!isJumping) {
		if (e.key === "ArrowUp" || e.key === " " || e instanceof TouchEvent) {
			dino.yVel = -25;
			isJumping = true;
		}
	}
}

//gravity
function imposeGravity() {
	dino.yVel += dino.gravity;
	dino.dy += dino.yVel;

	if (dino.dy >= canvas.height - dino.dHeight) {
		dino.dy = canvas.height - dino.dHeight;
		isJumping = false;
	}
}

function drawDino() {
	if (gameState !== "gameOver") {
		dino.sx = ticks % 2 === 0 ? dino.firstStepSx : dino.secondStepSx;
	}

	if (isJumping) {
		dino.sx = dino.jumpSx;
	}

	if (gameState === "gameOver") {
		dino.sx = dino.deadSx;
	}

	ctx.drawImage(
		sprites,
		dino.sx,
		dino.sy,
		dino.sWidth,
		dino.sHeight,
		dino.dx,
		dino.dy,
		dino.dWidth,
		dino.dHeight
	);
}

const hitBox = {
	rightSide(obj) {
		return obj.dx + obj.dWidth;
	},
	leftSide(obj) {
		return obj.dx;
	},
	top(obj) {
		return obj.dy;
	},
	bottom(obj) {
		return obj.dy + obj.dHeight;
	},
};

function checkCollision() {
	for (const cactus of cacti) {
		if (
			hitBox.rightSide(dino) - 10 >= hitBox.leftSide(cactus) &&
			hitBox.leftSide(dino) + 10 <= hitBox.rightSide(cactus) &&
			hitBox.bottom(dino) - 40 >= hitBox.top(cactus)
		) {
			bestScore = score;
			return (gameState = "gameOver");
		}
	}
	score += 0.3;
	gameSpeed = gameSpeed > 15 ? gameSpeed : gameSpeed + 0.001;
}

//Controls
document.addEventListener("touchstart", controls);
document.addEventListener("keydown", controls);
function controls(e) {
	if (gameState === "game") {
		return jump(e);
	}

	if (gameState != "game") {
		return resetGame(e);
	}
}

//Loops and screens
function increaseTicks() {
	if (gameState === "gameOver" || gameSpeed === 0) return;
	if (ticks === 60) {
		ticks = 0;
	}

	ticks++;
}
setInterval(increaseTicks, 1000 / gameSpeed);

function loop() {
	if (gameState === "menu") {
		showMenu();
	}

	if (gameState === "game") {
		drawGame();
	}

	if (gameState === "gameOver") {
		showGameOver();
	}

	requestAnimationFrame(loop);
}
loop();

function showMenu() {
	gameSpeed = 9;
	drawBoard();
	drawDino();
	ctx.fillStyle = "black";
	ctx.font = "20px Comic Sans MS";
	ctx.fillText("press spece to dinosorrrr", canvas.width / 2 - 100, canvas.height / 2);
}

function drawGame() {
	drawBoard();
	drawCacti();
	drawDino();
	imposeGravity();
	checkCollision();
	//drawHitboxes();
}

function showGameOver() {
	gameSpeed = 0;
	drawBoard();
	drawCacti();
	drawDino();

	ctx.drawImage(
		sprites,
		954,
		27,
		383,
		24,
		canvas.width / 2 - 383 / 2,
		canvas.height / 2 - 70,
		383,
		27
	);
	ctx.drawImage(sprites, 2, 2, 73, 65, canvas.width / 2 - 73 / 2, canvas.height / 2, 73, 65);
}

function resetGame(e) {
	if (e.key === " " || e instanceof TouchEvent) {
		score = 0;
		gameSpeed = 10;
		jump(e);
		generateCactus();
		cacti = [new Cactus()];
		return (gameState = "game");
	}
}

//utils
function getRandomNum(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		gameState = "gameOver";
	}
});

function drawHitboxes() {
	for (const object of [dino, ...cacti]) {
		ctx.beginPath();
		ctx.rect(object.dx, object.dy, object.dWidth, object.dHeight);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#ff0000";
		ctx.stroke();
	}
}

// Brr Brr Patapim Dino Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GROUND_Y = 250;
const GRAVITY = 0.45; // was 0.7, now more forgiving
const JUMP_VELOCITY = -12;
let OBSTACLE_SPEED = 6;
const OBSTACLE_INTERVAL = 90;

// --- PIXEL ART SPRITES ---
// Patapim (player) - pixel brainrot style
const playerSprite = [
    '................',
    '.....33333......',
    '....3222223.....',
    '...322222223....',
    '...322332223....',
    '...322222223....',
    '....3222223.....',
    '.....33333......',
    '....33..33......',
    '...33....33.....',
    '...33....33.....',
    '...33....33.....',
    '....3....3......',
    '....3....3......',
    '................',
    '................'
];
// Cactus Elephant (obstacle)
const cactusElephantSprite = [
    '................',
    '...44444444.....',
    '..4444444444....',
    '.4444..44444....',
    '.44444444444....',
    '.44444444444....',
    '..4444444444....',
    '...44444444.....',
    '..44....44......',
    '.44......44.....',
    '.44......44.....',
    '.44......44.....',
    '..4......4......',
    '..4......4......',
    '................',
    '................'
];
// Bird (obstacle)
const birdSprite = [
    '................',
    '.....5555.......',
    '....555555......',
    '...55555555.....',
    '...55555555.....',
    '...55555555.....',
    '....555555......',
    '.....5555.......',
    '....55..55......',
    '...55....55.....',
    '...55....55.....',
    '...55....55.....',
    '....5....5......',
    '....5....5......',
    '................',
    '................'
];
// Crocodile (dropped by bird)
const crocSprite = [
    '........',
    '..6666..',
    '.666666.',
    '.666666.',
    '.666666.',
    '.666666.',
    '..6666..',
    '........'
];
// Color mapping for sprites
const colorMap = {
    '3': '#aaffee', // Patapim (cyan)
    '2': '#ff55aa', // Patapim (pink)
    '4': '#228B22', // Cactus Elephant (green)
    '5': '#ffcc00', // Bird (yellow)
    '6': '#228B22', // Crocodile (green)
    '.': 'rgba(0,0,0,0)'
};

// --- IMAGE ASSET LOADING ---
const assets = {
    background: null, // e.g. 'assets/background.png'
    ground: null,     // e.g. 'assets/ground.png'
    cloud: null,      // e.g. 'assets/cloud.png'
    player: null,     // e.g. 'assets/player.png'
    cactusElephant: null, // e.g. 'assets/cactus_elephant.png'
    bird: null,       // e.g. 'assets/bird.png'
    croc: null        // e.g. 'assets/bombardiro-crocodilo.png'
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // resolve null if not found
        img.src = src;
    });
}

async function loadAssets() {
    assets.background = await loadImage('assets/background.png');
    assets.ground = await loadImage('assets/ground.png');
    assets.cloud = await loadImage('assets/cappucino-asssasino.png');
    assets.player = await loadImage('assets/brr-brr-patapim.png');
    assets.cactusElephant = await loadImage('assets/lirili-larila.png');
    assets.bird = await loadImage('assets/bombardiro-crocodilo.png');
    assets.croc = await loadImage('assets/bombardiro-crocodilo.png');
}

// --- MODIFIED DRAW FUNCTIONS ---
function drawBackground() {
    if (assets.background) {
        ctx.drawImage(assets.background, 0, 0, canvas.width, GROUND_Y);
        // Optionally, draw clouds as separate images for parallax
        if (assets.cloud) {
            ctx.drawImage(assets.cloud, 100, 40, 120, 60);
            ctx.drawImage(assets.cloud, 600, 20, 100, 50);
        }
        return;
    }
    // Gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGradient.addColorStop(0, '#7ec0ee'); // light blue
    skyGradient.addColorStop(1, '#e0f7fa'); // pale blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    // Sun
    ctx.beginPath();
    ctx.arc(80, 60, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#fff59d';
    ctx.shadowColor = '#fffde7';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Clouds
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(200, 70, 50, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(250, 60, 40, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(600, 40, 60, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(670, 55, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function drawGround() {
    if (assets.ground) {
        for (let i = 0; i < canvas.width; i += assets.ground.width) {
            ctx.drawImage(assets.ground, i, GROUND_Y, assets.ground.width, assets.ground.height);
        }
        return;
    }
    // Fancy ground with grass and dirt
    // Dirt
    ctx.fillStyle = '#bca16b';
    ctx.fillRect(0, GROUND_Y, canvas.width, 24);
    // Grass
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(0, GROUND_Y, canvas.width, 8);
    // Grass tufts
    for (let i = 0; i < canvas.width; i += 32) {
        ctx.beginPath();
        ctx.arc(i + 8, GROUND_Y + 4, 6, Math.PI, 0);
        ctx.arc(i + 20, GROUND_Y + 6, 4, Math.PI, 0);
        ctx.fillStyle = '#388e3c';
        ctx.fill();
    }
}

function drawSpriteImage(img, x, y, w, h) {
    if (img) ctx.drawImage(img, x, y, w, h);
}

function drawSprite(sprite, x, y, pixelSize = 4, img) {
    if (img) {
        ctx.drawImage(img, x, y, sprite[0].length * pixelSize, sprite.length * pixelSize);
        return;
    }
    // Only use pixel art if no image asset is loaded
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const color = colorMap[sprite[row][col]];
            if (color && color !== 'rgba(0,0,0,0)') {
                ctx.fillStyle = color;
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// --- MODIFIED OBSTACLE/PLAYER DRAW ---
const player = {
    x: 80,
    y: GROUND_Y - 16 * 4,
    vy: 0,
    width: 16 * 4,
    height: 16 * 4,
    jumping: false,
    draw() {
        if (assets.player) {
            ctx.drawImage(assets.player, this.x, this.y, this.width, this.height);
        } else {
            drawSprite(playerSprite, this.x, this.y, 4);
        }
    },
    update() {
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y >= GROUND_Y - this.height) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.jumping = false;
        }
    },
    jump() {
        if (!this.jumping) {
            this.vy = JUMP_VELOCITY;
            this.jumping = true;
        }
    }
};

function drawObstacle(ob) {
    if (ob.type === 'cactus') {
        if (assets.cactusElephant) {
            ctx.drawImage(assets.cactusElephant, ob.x, ob.y, ob.width, ob.height);
        } else {
            drawSprite(cactusElephantSprite, ob.x, ob.y, 4);
        }
    } else if (ob.type === 'bird') {
        if (assets.bird) {
            ctx.drawImage(assets.bird, ob.x, ob.y, ob.width, ob.height);
        } else {
            drawSprite(birdSprite, ob.x, ob.y, 4);
        }
        if (ob.dropCroc && ob.crocY !== null) {
            if (assets.croc) {
                ctx.drawImage(assets.croc, ob.x + 16, ob.crocY, 32, 32);
            } else {
                drawSprite(crocSprite, ob.x + 16, ob.crocY, 4);
            }
        }
    }
}

// --- HITBOX OFFSETS FOR PNGS ---
const hitboxOffsets = {
    player: { x: 18, y: 10, w: 44, h: 54 }, // adjust as needed for brr-brr-patapim.png
    cactusElephant: { x: 10, y: 20, w: 54, h: 44 }, // adjust for lirili-larila.png
    bird: { x: 12, y: 18, w: 44, h: 28 }, // adjust for bombardiro-crocodilo.png
    croc: { x: 8, y: 8, w: 32, h: 24 } // adjust for bombardiro-crocodilo.png
};

function getPlayerHitbox() {
    if (assets.player) {
        const o = hitboxOffsets.player;
        return {
            x: player.x + o.x,
            y: player.y + o.y,
            width: o.w,
            height: o.h
        };
    }
    return player; // fallback to full rect
}

function getObstacleHitbox(ob) {
    if (ob.type === 'cactus' && assets.cactusElephant) {
        const o = hitboxOffsets.cactusElephant;
        return {
            x: ob.x + o.x,
            y: ob.y + o.y,
            width: o.w,
            height: o.h
        };
    }
    if (ob.type === 'bird' && assets.bird) {
        const o = hitboxOffsets.bird;
        return {
            x: ob.x + o.x,
            y: ob.y + o.y,
            width: o.w,
            height: o.h
        };
    }
    return ob; // fallback to full rect
}

function getCrocHitbox(ob) {
    if (assets.croc) {
        const o = hitboxOffsets.croc;
        return {
            x: ob.x + 16 + o.x,
            y: ob.crocY + o.y,
            width: o.w,
            height: o.h
        };
    }
    return {
        x: ob.x + 16,
        y: ob.crocY,
        width: 8 * 4,
        height: 8 * 4
    };
}

// Obstacles
let obstacles = [];
let frame = 0;
let score = 0;
let gameOver = false;

function spawnObstacle() {
    const type = Math.random() < 0.6 ? 'cactus' : 'bird';
    if (type === 'cactus') {
        obstacles.push({
            type: 'cactus',
            x: canvas.width,
            y: GROUND_Y - 16 * 4,
            width: 16 * 4,
            height: 16 * 4
        });
    } else {
        // Bird with a chance to drop a crocodilo
        const bird = {
            type: 'bird',
            x: canvas.width,
            y: GROUND_Y - 16 * 8,
            width: 16 * 4,
            height: 16 * 4,
            dropCroc: Math.random() < 0.5,
            crocDropped: false,
            crocY: null
        };
        obstacles.push(bird);
    }
}

function updateObstacles() {
    for (let ob of obstacles) {
        ob.x -= OBSTACLE_SPEED;
        if (ob.type === 'bird' && ob.dropCroc && !ob.crocDropped && ob.x < player.x + 100) {
            ob.crocDropped = true;
            ob.crocY = ob.y + 16 * 4;
        }
        if (ob.type === 'bird' && ob.crocDropped && ob.crocY !== null) {
            ob.crocY += 8;
        }
    }
    obstacles = obstacles.filter(ob => ob.x + ob.width > 0 || (ob.crocY !== null && ob.crocY < canvas.height));
}

function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function checkGameOver() {
    const playerBox = getPlayerHitbox();
    for (let ob of obstacles) {
        if (ob.type === 'cactus' && checkCollision(playerBox, getObstacleHitbox(ob))) return true;
        if (ob.type === 'bird' && checkCollision(playerBox, getObstacleHitbox(ob))) return true;
        if (ob.type === 'bird' && ob.crocDropped && ob.crocY !== null) {
            if (checkCollision(playerBox, getCrocHitbox(ob))) return true;
        }
    }
    return false;
}

function drawScore() {
    ctx.fillStyle = '#222';
    ctx.font = '32px monospace';
    ctx.fillText('Score: ' + score, 20, 40);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGround();
    player.update();
    player.draw();
    // Increase speed as score increases
    OBSTACLE_SPEED = 6 + Math.floor(score / 100);
    updateObstacles();
    for (let ob of obstacles) drawObstacle(ob);
    drawScore();
    if (frame % OBSTACLE_INTERVAL === 0) spawnObstacle();
    if (checkGameOver()) {
        gameOver = true;
        ctx.fillStyle = '#B22222';
        ctx.font = '48px monospace';
        ctx.fillText('GAME OVER', 250, 150);
        ctx.font = '24px monospace';
        ctx.fillText('Press Space to Restart', 240, 200);
        return;
    }
    frame++;
    score = Math.floor(frame / 3);
    if (!gameOver) requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        if (gameOver) {
            // Reset game
            obstacles = [];
            frame = 0;
            score = 0;
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.jumping = false;
            gameOver = false;
            requestAnimationFrame(gameLoop);
        } else {
            player.jump();
        }
    }
});

// --- GAME INIT ---
async function startGame() {
    await loadAssets().catch(() => {}); // load images, ignore errors if missing
    requestAnimationFrame(gameLoop);
}

// Start the game
startGame();

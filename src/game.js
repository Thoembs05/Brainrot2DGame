// Brr Brr Patapim Dino Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GROUND_Y = 250;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -12;
const OBSTACLE_SPEED = 6;
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

function drawSprite(sprite, x, y, pixelSize = 4) {
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

// Player object
const player = {
    x: 80,
    y: GROUND_Y - 16 * 4,
    vy: 0,
    width: 16 * 4,
    height: 16 * 4,
    jumping: false,
    draw() {
        drawSprite(playerSprite, this.x, this.y, 4);
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

function drawObstacle(ob) {
    if (ob.type === 'cactus') {
        drawSprite(cactusElephantSprite, ob.x, ob.y, 4);
    } else if (ob.type === 'bird') {
        drawSprite(birdSprite, ob.x, ob.y, 4);
        if (ob.dropCroc && ob.crocY !== null) {
            drawSprite(crocSprite, ob.x + 16, ob.crocY, 4);
        }
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
    for (let ob of obstacles) {
        if (ob.type === 'cactus' && checkCollision(player, ob)) return true;
        if (ob.type === 'bird' && checkCollision(player, ob)) return true;
        if (ob.type === 'bird' && ob.crocDropped && ob.crocY !== null) {
            const crocBox = {
                x: ob.x + 16,
                y: ob.crocY,
                width: 8 * 4,
                height: 8 * 4
            };
            if (checkCollision(player, crocBox)) return true;
        }
    }
    return false;
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    // Clouds
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(120, 60, 30, 0, Math.PI * 2);
    ctx.arc(150, 60, 20, 0, Math.PI * 2);
    ctx.arc(180, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(600, 40, 25, 0, Math.PI * 2);
    ctx.arc(630, 40, 18, 0, Math.PI * 2);
    ctx.arc(655, 40, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function drawGround() {
    ctx.fillStyle = '#888';
    ctx.fillRect(0, GROUND_Y, canvas.width, 4 * 2);
    // Add some grass tufts
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(i, GROUND_Y, 8, 8);
    }
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

// Start the game
requestAnimationFrame(gameLoop);

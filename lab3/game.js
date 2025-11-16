const gameArea = {
    width: 800,
    height: 600
};

const rows = 5;
const cols = 10;

const brickSize = {
    width: 44.5,
    height: 18
};

const player = {
    width: 150,
    height: 18, 
    speed: 25,
    positionX: gameArea.width/2 - (90/2),
    positionY: 450
}

const ball = {
    width: 15,
    height: 15,
    positionX: gameArea.width/2 - (15/2),
    positionY: 435,
    moveX: -3,
    moveY: -3,
    multiplayer: 1.05
}

let bricks = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let maxScore = 0;

const hit_brick_sound = new Audio("hit_brick.mp3");
const hit_paddle_sound = new Audio("hit_paddle.mp3");
const game_start_sound = new Audio("gamestart.mp3");
const game_over_sound = new Audio("gameover.mp3");
const winner_sound = new Audio("winner.mp3");

const handlePressKey = (event, context) => {
    switch(event.keyCode) {
        case 32:
            if(!gameStarted || gameOver) {
                resetGame(context);
                initGame(context);

                ball.moveX = Math.random() < 0.5 ? -Math.abs(ball.moveX) : Math.abs(ball.moveX);

                gameStarted = true;
                gameOver = false;
                game_start_sound.play();
            }
            break;
        case 65:
            if(player.positionX - player.speed >= -12)
                player.positionX -= player.speed;
            break;
        case 68:
            if(player.positionX + player.speed <= (gameArea.width - player.width + 12))
                player.positionX += player.speed;
            break;
    }
}

const initGame = (context) =>  {
    context.clearRect(0, 0, gameArea.width, gameArea.height);
    initBricks();
}

const resetGame = () => {
    player.positionX = gameArea.width/2 - player.width/2;

    ball.positionX = gameArea.width/2 - ball.width/2;
    ball.positionY = 435;
    ball.moveX = 3;
    ball.moveY = -3;
    
    gameStarted = false;
    gameOver = false;
    score = 0;
}

const drawScore = (context) => {
    context.font = "bold italic 18px Helvetica";
    context.textBaseline = "top";
    
    context.textAlign = "left";
    context.fillStyle = "white";
    context.fillText("Score: " + score, 20, 20);

    context.textAlign = "right";
    context.fillText("Max score: " + maxScore, gameArea.width - 20, 20);
}

const drawBricks = (context) => {
    bricks.forEach((brick) => {
        context.save();
        context.shadowColor = 'rgba(0, 0, 0, 0.1)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 4;

        const grad = context.createLinearGradient(
            brick.positionX, brick.positionY,
            brick.positionX, brick.positionY + brick.height
        );
        grad.addColorStop(0, "#fff"); 
        grad.addColorStop(0.7, brick.color);
        grad.addColorStop(1, "#3f3f3fff");

        context.fillStyle = grad;
        context.fillRect(brick.positionX, brick.positionY, brick.width, brick.height);

        context.lineWidth = 1.8;
        context.shadowBlur = 0;
        context.strokeStyle = "rgba(59, 57, 57, 0.65)";
        context.strokeRect(brick.positionX, brick.positionY, brick.width, brick.height);

        context.beginPath();
        context.moveTo(brick.positionX + 2, brick.positionY + 2);
        context.lineTo(brick.positionX + brick.width - 2, brick.positionY + 2);
        context.strokeStyle = "rgba(255, 255, 255, 0.77)";
        context.lineWidth = 2.2;
        context.stroke();

        context.restore();
    });
};

const drawPlayer = (context) => {
    context.save();
    context.shadowColor = 'rgba(40,40,40,0.35)';
    context.shadowBlur = 12;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 8;

    let grad = context.createLinearGradient(
        player.positionX, player.positionY,
        player.positionX, player.positionY + player.height
    );
    grad.addColorStop(0, "#e7e7e7"); 
    grad.addColorStop(0.48, "rgb(140,140,140)");
    grad.addColorStop(1, "#353535");

    context.fillStyle = grad;
    context.fillRect(player.positionX, player.positionY, player.width, player.height);

    context.shadowBlur = 0;
    context.beginPath();
    context.moveTo(player.positionX + 5, player.positionY + 2);
    context.lineTo(player.positionX + player.width - 6, player.positionY + 2);
    context.strokeStyle = "#fff";
    context.lineWidth = 2.1;
    context.stroke();
    context.restore();

    context.save();
    context.lineWidth = 2;
    context.strokeStyle = "#222";
    context.strokeRect(player.positionX, player.positionY, player.width, player.height);
    context.restore();
};

const drawBall = (context) => {
    const centerX = ball.positionX + ball.width/2;
    const centerY = ball.positionY + ball.height/2;
    const radius = ball.width/2;
    context.save();
    
    context.shadowColor = "rgba(0,0,0,0.38)";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(centerX + 2, centerY + 8, radius*0.75, 0, 2 * Math.PI); 
    context.fillStyle = "rgba(10,10,10,0.33)";
    context.fill();
    context.shadowBlur = 0;

    const grad = context.createRadialGradient(
        centerX - radius/2, centerY - radius/2, radius/5,
        centerX, centerY, radius
    );
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.4, "#eee");
    grad.addColorStop(0.85, "#bebebe");
    grad.addColorStop(1, "#222");

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = grad;
    context.fill();

    context.lineWidth = 1.2;
    context.strokeStyle = "#444";
    context.stroke();

    context.beginPath();
    context.arc(centerX - radius/3, centerY - radius/3, radius/3, 0, 2 * Math.PI);
    context.fillStyle = "rgba(255,255,255,0.9)";
    context.globalAlpha = 0.75;
    context.fill();
    context.globalAlpha = 1.0;
    context.restore();
};


const moveBall = () => {
    ball.positionX += ball.moveX;
    ball.positionY += ball.moveY;

    checkCollisions();
}

const checkCollisions = () => {
    if(ball.positionX <= 0 || ball.positionX + ball.width >= gameArea.width) {
        ball.moveX = -ball.moveX;
    }

    if(ball.positionY <= 0) {
        ball.moveY = -ball.moveY;
    }

    if(
        ball.positionY + ball.height >= player.positionY &&
        ball.positionY + ball.height <= player.positionY + player.height &&
        ball.positionX + ball.width >= player.positionX &&
        ball.positionX <= player.positionX + player.width
    ) {
        ball.moveY = -ball.moveY;
        hit_paddle_sound.play();
    }

    bricks.forEach((brick, index) => {
        if(
            ball.positionX + ball.width >= brick.positionX &&
            ball.positionX <= brick.positionX + brick.width &&
            ball.positionY + ball.height >= brick.positionY &&
            ball.positionY <= brick.positionY + brick.height
        ) {
            ball.moveY = -ball.moveY;

            if(isCornerHit(ball, brick)) {
                ball.moveX *= ball.multiplayer;
                ball.moveY *= ball.multiplayer;
            }

            bricks.splice(index, 1);
            hit_brick_sound.play();
            score++;

            if(score > maxScore) {
                maxScore = score;
                localStorage.setItem("breakoutMaxScore", maxScore);
            }
        }
    });

    if(ball.positionY >= gameArea.height || bricks.length === 0) {
        gameOver = true;
    }
}

function isCornerHit(ball, brick) {
    const ballCenterX = ball.positionX + ball.width / 2;
    const ballCenterY = ball.positionY + ball.height / 2;

    const brickCenterX = brick.positionX + brick.width / 2;
    const brickCenterY = brick.positionY + brick.height / 2;

    const dx = Math.abs(ballCenterX - brickCenterX);
    const dy = Math.abs(ballCenterY - brickCenterY);

    return Math.abs(dx - dy) < 5; 
}


const initBricks = () => {
    bricks = []
    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < cols; j++) {
            let color;
            switch(i) {
                case 0: color = "rgb(153, 51, 0)"; break;
                case 1: color = "rgb(255, 0, 0)"; break;
                case 2: color = "rgb(255, 153, 204)"; break;
                case 3: color = "rgb(0, 255, 0)"; break;
                case 4: color = "rgb(255, 255, 153)"; break;
            }
            bricks.push({
                positionX: 20 + j * (brickSize.width + 35),
                positionY: 65 + i * (brickSize.height + 20),
                width: brickSize.width,
                height: brickSize.height,
                color: color
            });
        }
    }
}

window.onload = () => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");

    context.font = "bold 36px Helvetica";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("BREAKOUT", gameArea.width/2, gameArea.height/2);

    context.font = "bold italic 18px Helvetica";
    context.fillText("Press SPACE to begin", gameArea.width/2, gameArea.height/2 + 46);

    if(localStorage.getItem("breakoutMaxScore")) {
        maxScore = parseInt(localStorage.getItem("breakoutMaxScore"));
    }

    document.addEventListener("keydown", (event) => handlePressKey(event, context));

    requestAnimationFrame(() => update(context))
}

const update = (context) => {
    if(gameStarted) {
        if(!gameOver) {
            context.clearRect(0, 0, gameArea.width, gameArea.height);
            drawScore(context);
            drawBricks(context);
            drawPlayer(context);
            drawBall(context);
            moveBall();
        } else {
            context.clearRect(0, 0, gameArea.width, gameArea.height);
            context.font = "bold 40px Helvetica";
            context.fillStyle = "yellow";
            context.textAlign = "center";
            context.textBaseline = "middle";
            if(bricks.length === 0){
                context.fillText("VICTORY", gameArea.width/2, gameArea.height/2);
                winner_sound.play();
            }else {
                context.fillText("GAME OVER", gameArea.width/2, gameArea.height/2);
                game_over_sound.play();
            }
        }
    }
    requestAnimationFrame(() => update(context));
}

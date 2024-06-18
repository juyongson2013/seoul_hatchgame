const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundHeight = 100;
const hatch = {
    x: 50,
    y: canvas.height - groundHeight - 100,
    width: 100,
    height: 100,
    speed: 5,
    dy: 0,
    gravity: 1.5,
    jumpPower: -25,
    isJumping: false,
    image: new Image()
};

hatch.image.src = 'hatch.png'; // 해치 이미지 파일 경로

const obstacleImage = new Image();
obstacleImage.src = 'obstacle.png'; // 장애물 이미지 파일 경로

const flyingObstacleImage = new Image();
flyingObstacleImage.src = 'flying_obstacle.png'; // 날아다니는 장애물 이미지 파일 경로

const obstacles = [];
const flyingObstacles = [];
const obstacleInterval = 2000; // 장애물 생성 간격 (밀리초)
const flyingObstacleInterval = 3000; // 날아다니는 장애물 생성 간격 (밀리초)
let lastObstacleTime = 0;
let lastFlyingObstacleTime = 0;

const keys = {
    up: false
};

let score = 0; // 점수 변수 추가
let highScore = localStorage.getItem('highScore') || 0; // 최고 점수 변수 추가
let obstacleSpeed = 10; // 장애물 초기 속도

function createObstacle() {
    const obstacle = {
        x: canvas.width, // 장애물이 화면 오른쪽에서 시작하도록 설정
        y: canvas.height - groundHeight - 100, // 땅에 닿도록 설정
        width:80, // 장애물 너비를 80으로 설정
        height: 100, // 장애물 높이를 100으로 설정
        speed: obstacleSpeed, // 현재 장애물 속도 설정
        image: obstacleImage,
        scored: false // 장애물을 넘었는지 확인하는 플래그
    };
    obstacles.push(obstacle);
}

function createFlyingObstacle() {
    let yPosition;
    let isOverlapping;
    do {
        isOverlapping = false;
        yPosition = Math.random() * (canvas.height - groundHeight - 300) + 50; // 랜덤한 높이에서 시작하도록 설정
        obstacles.forEach(obstacle => {
            if (Math.abs(obstacle.y - yPosition) < 150) { // 겹치지 않도록 간격 설정
                isOverlapping = true;
            }
        });
    } while (isOverlapping);

    const flyingObstacle = {
        x: canvas.width, // 날아다니는 장애물이 화면 오른쪽에서 시작하도록 설정
        y: yPosition,
        width: 50, // 장애물 너비를 50으로 설정
        height: 50, // 장애물 높이를 50으로 설정
        speed: obstacleSpeed, // 현재 장애물 속도 설정
        image: flyingObstacleImage,
        scored: false // 장애물을 넘었는지 확인하는 플래그
    };
    flyingObstacles.push(flyingObstacle);
}

function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacle.speed;
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1); // 화면 밖으로 나간 장애물 제거
        }
        // 해치가 장애물을 넘었는지 확인하고 점수 증가
        if (!obstacle.scored && obstacle.x + obstacle.width < hatch.x) {
            score += 10; // 점수를 10씩 증가
            obstacle.scored = true;
            // 점수가 특정 값에 도달할 때마다 장애물 속도 증가
            if (score % 50 === 0) {
                obstacleSpeed += 2; // 장애물 속도 증가
            }
        }
    });

    const currentTime = Date.now();
    if (currentTime - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = currentTime;
    }
}

function updateFlyingObstacles() {
    if (score >= 150) { // 점수가 150 이상일 때만 날아다니는 장애물을 생성
        flyingObstacles.forEach((flyingObstacle, index) => {
            flyingObstacle.x -= flyingObstacle.speed;
            if (flyingObstacle.x + flyingObstacle.width < 0) {
                flyingObstacles.splice(index, 1); // 화면 밖으로 나간 장애물 제거
            }
            // 해치가 장애물을 넘었는지 확인하고 점수 증가
            if (!flyingObstacle.scored && flyingObstacle.x + flyingObstacle.width < hatch.x) {
                score += 10; // 점수를 10씩 증가
                flyingObstacle.scored = true;
                // 점수가 특정 값에 도달할 때마다 장애물 속도 증가
                if (score % 50 === 0) {
                    obstacleSpeed += 2; // 장애물 속도 증가
                }
            }
        });

        const currentTime = Date.now();
        if (currentTime - lastFlyingObstacleTime > flyingObstacleInterval) {
            createFlyingObstacle();
            lastFlyingObstacleTime = currentTime;
        }
    }
}

function detectCollision() {
    obstacles.concat(flyingObstacles).forEach(obstacle => {
        if (hatch.x < obstacle.x + obstacle.width &&
            hatch.x + hatch.width > obstacle.x &&
            hatch.y < obstacle.y + obstacle.height &&
            hatch.y + hatch.height > obstacle.y) {
            alert("게임 오버!");
            resetGame();
        }
    });
}

function update() {
    if (keys.up && !hatch.isJumping) {
        hatch.dy = hatch.jumpPower;
        hatch.isJumping = true;
    }

    hatch.dy += hatch.gravity;
    hatch.y += hatch.dy;

    if (hatch.y + hatch.height >= canvas.height - groundHeight) {
        hatch.y = canvas.height - groundHeight - hatch.height;
        hatch.dy = 0;
        hatch.isJumping = false;
    }

    updateObstacles();
    updateFlyingObstacles();
    draw();
    detectCollision();
    
    // 현재 점수가 최고 점수를 넘으면 업데이트
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore); // 최고 점수 저장
    }

    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.drawImage(hatch.image, hatch.x, hatch.y, hatch.width, hatch.height);
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    flyingObstacles.forEach(flyingObstacle => {
        ctx.drawImage(flyingObstacle.image, flyingObstacle.x, flyingObstacle.y, flyingObstacle.width, flyingObstacle.height);
    });
    // 점수 표시
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 50);
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 20, 80); // 최고 점수 표시
}

function resetGame() {
    hatch.x = 50;
    hatch.y = canvas.height - groundHeight - 100;
    hatch.dy = 0;
    obstacles.length = 0; // 모든 장애물 제거
    flyingObstacles.length = 0; // 모든 날아다니는 장애물 제거
    lastObstacleTime = Date.now();
    lastFlyingObstacleTime = Date.now();
    score = 0; // 점수 초기화
    obstacleSpeed = 10; // 장애물 속도 초기화
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        keys.up = true; // 스페이스 키와 위쪽 화살표 키 추가
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        keys.up = false; // 스페이스 키와 위쪽 화살표 키 추가
    }
});

hatch.image.onload = function() {
    update();
}

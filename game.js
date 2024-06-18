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

const itemImage = new Image();
itemImage.src = 'item.png'; // 아이템 이미지 파일 경로

const obstacles = [];
const flyingObstacles = [];
const items = [];
const obstacleInterval = 2000; // 장애물 생성 간격 (밀리초)
const flyingObstacleInterval = 3000; // 날아다니는 장애물 생성 간격 (밀리초)
const itemSpawnRate = 0.01; // 아이템 생성 확률
let lastObstacleTime = 0;
let lastFlyingObstacleTime = 0;
let lastItemTime = 0;
let speedBoostActive = false;
let invincible = false;
let speedBoostEndTime = 0;

const keys = {
    up: false
};

let score = 0; // 점수 변수 추가
let highScore = localStorage.getItem('highScore') || 0; // 최고 점수 변수 추가
let obstacleSpeed = 10; // 장애물 초기 속도

let developerMode = false;
let autoMode = false;

function authenticateDeveloper() {
    const password = prompt('개발자 비밀번호를 입력하세요:');
    if (password === 'jy20130129') { // 비밀번호를 개발자만 아는 값으로 설정
        developerMode = true;
        alert('개발자 인증 완료. 오토 모드를 활성화할 수 있습니다.');
    } else {
        alert('비밀번호가 틀렸습니다.');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyD') { // D 키를 누르면 개발자 인증 시도
        authenticateDeveloper();
    } else if (developerMode && e.code === 'KeyA') { // A 키를 누르면 오토 모드 토글
        autoMode = !autoMode;
        alert(`오토 모드가 ${autoMode ? '활성화' : '비활성화'}되었습니다.`);
    } else if (e.code === 'ArrowUp' || e.code === 'Space') {
        keys.up = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        keys.up = false;
    }
});

function createObstacle() {
    const obstacle = {
        x: canvas.width, // 장애물이 화면 오른쪽에서 시작하도록 설정
        y: canvas.height - groundHeight - 100, // 땅에 닿도록 설정
        width: 50, // 장애물 너비를 50으로 설정
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

function createItem() {
    const item = {
        x: canvas.width, // 아이템이 화면 오른쪽에서 시작하도록 설정
        y: Math.random() * (canvas.height - groundHeight - 100), // 랜덤한 높이에서 시작하도록 설정
        width: 50, // 아이템 너비를 50으로 설정
        height: 50, // 아이템 높이를 50으로 설정
        image: itemImage,
        collected: false // 아이템을 먹었는지 확인하는 플래그
    };
    items.push(item);
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
    if (score >= 150) { // 점수가 150 이상일 때만 날아다니는 장애물 생성
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

function updateItems() {
    const currentTime = Date.now();
    if (currentTime - lastItemTime > 1000 && Math.random() < itemSpawnRate) {
        createItem();
        lastItemTime = currentTime;
    }

    items.forEach((item, index) => {
        item.x -= obstacleSpeed; // 아이템이 장애물과 같은 속도로 움직이도록 설정
        if (item.x + item.width < 0) {
            items.splice(index, 1); // 화면 밖으로 나간 아이템 제거
        }
        // 해치가 아이템을 먹었는지 확인
        if (!item.collected && hatch.x < item.x + item.width && hatch.x + hatch.width > item.x && hatch.y < item.y + item.height && hatch.y + hatch.height > item.y) {
            item.collected = true;
            activateSpeedBoost(); // 아이템을 먹으면 속도 증가 및 무적 상태 활성화
            items.splice(index, 1); // 아이템 제거
        }
    });
}

function activateSpeedBoost() {
    speedBoostActive = true;
    invincible = true;
    speedBoostEndTime = Date.now() + 3000; // 3초 동안 효과 지속
    obstacleSpeed += 5; // 속도 증가
}

function detectCollision() {
    if (!invincible) { // 무적 상태가 아닐 때만 충돌 감지
        obstacles.forEach(obstacle => {
            if (hatch.x < obstacle.x + obstacle.width && hatch.x + hatch.width > obstacle.x && hatch.y < obstacle.y + obstacle.height && hatch.y + hatch.height > obstacle.y) {
                resetGame(); // 충돌 시 게임 리셋
            }
        });
        flyingObstacles.forEach(flyingObstacle => {
            if (hatch.x < flyingObstacle.x + flyingObstacle.width && hatch.x + hatch.width > flyingObstacle.x && hatch.y < flyingObstacle.y + flyingObstacle.height && hatch.y + hatch.height > flyingObstacle.y) {
                resetGame(); // 충돌 시 게임 리셋
            }
        });
    }
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
    items.forEach(item => {
        ctx.drawImage(item.image, item.x, item.y, item.width, item.height);
    });

    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Score: ' + score, canvas.width - 150, 50);
    ctx.fillText('High Score: ' + highScore, canvas.width - 150, 80);
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    score = 0;
    obstacleSpeed = 10;
    obstacles.length = 0;
    flyingObstacles.length = 0;
    items.length = 0;
    speedBoostActive = false;
    invincible = false;
    hatch.y = canvas.height - groundHeight - hatch.height;
}

function update() {
    if (!autoMode) {
        if (keys.up && !hatch.isJumping) {
            hatch.dy = hatch.jumpPower;
            hatch.isJumping = true;
        }
    } else {
        if (obstacles.length > 0 && !hatch.isJumping) {
            const nextObstacle = obstacles[0];
            if (nextObstacle.x < hatch.x + hatch.width + 20) {
                hatch.dy = hatch.jumpPower;
                hatch.isJumping = true;
            }
        }
    }

    hatch.dy += hatch.gravity;
    hatch.y += hatch.dy;

    if (hatch.y + hatch.height >= canvas.height - groundHeight) {
        hatch.y = canvas.height - groundHeight - hatch.height;
        hatch.dy = 0;
        hatch.isJumping = false;
    }

    if (speedBoostActive && Date.now() > speedBoostEndTime) {
        speedBoostActive = false;
        invincible = false;
    }

    if (!speedBoostActive && obstacleSpeed > 10) {
        obstacleSpeed -= 0.1; // 효과가 끝난 후 속도 천천히 감소
        if (obstacleSpeed < 10) {
            obstacleSpeed = 10; // 원래 속도로 돌아오면 속도 고정
        }
    }

    updateObstacles();
    updateFlyingObstacles();
    updateItems();
    draw();
    detectCollision();

    if (score > highScore) {
        highScore = score; // 게임 중에도 최고 점수 갱신
        localStorage.setItem('highScore', highScore);
    }

    requestAnimationFrame(update);
}

update();


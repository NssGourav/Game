const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');


canvas.width = 800;
canvas.height = 600;


let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;


const balloon = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    radius: 25,
    velocity: 0,
    lift: -3,          
    maxLift: -3,       
    liftAcceleration: -0.15, 
    gravity: 0.3,      
    drag: 0.98,       
    floating: false,
    rotation: 0,
    swayAmount: 0.02,
    isRising: false,
    riseSpeed: 0
};

const obstacles = [];
const obstacleWidth = 40;  
const gapHeight = 250;     
const obstacleSpeed = 2;   
let obstacleTimer = 0;
const obstacleInterval = 150; 


const clouds = [];
const cloudImages = [];
let cloudTimer = 0;


let showInstructions = true;
let instructionTimer = 3; 


function createCloudImages() {
    const sizes = [
        { width: 80, height: 40 },
        { width: 100, height: 50 },
        { width: 120, height: 60 }
    ];

    sizes.forEach(size => {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = size.width;
        offscreenCanvas.height = size.height;

        offscreenCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        offscreenCtx.beginPath();
        offscreenCtx.arc(size.width/4, size.height/2, size.height/3, 0, Math.PI * 2);
        offscreenCtx.arc(size.width/2, size.height/2, size.height/2, 0, Math.PI * 2);
        offscreenCtx.arc(3*size.width/4, size.height/2, size.height/3, 0, Math.PI * 2);
        offscreenCtx.fill();

        cloudImages.push(offscreenCanvas);
    });
}


function createCloud() {
    const cloudImage = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    clouds.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - cloudImage.height),
        image: cloudImage,
        speed: 1 + Math.random()
    });
}


function createObstacle() {

    const minGapPosition = 100;
    const maxGapPosition = canvas.height - gapHeight - 100;
    const gapY = minGapPosition + Math.random() * (maxGapPosition - minGapPosition);
    
    obstacles.push({
        x: canvas.width,
        gapY: gapY,
        passed: false,
        topHeight: gapY,
        bottomHeight: canvas.height - (gapY + gapHeight)
    });
}


function drawBalloon() {
    ctx.save();
    ctx.translate(balloon.x, balloon.y);
    ctx.rotate(Math.sin(balloon.rotation) * 0.1);

    ctx.beginPath();
    ctx.moveTo(0, balloon.radius);
    ctx.quadraticCurveTo(
        -5 * Math.sin(balloon.rotation), 
        balloon.radius + 15,
        0,
        balloon.radius + 30
    );
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, balloon.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        -balloon.radius/3,
        -balloon.radius/3,
        balloon.radius/4,
        0,
        0,
        balloon.radius
    );
    gradient.addColorStop(0, '#ff4d4d'); 
    gradient.addColorStop(1, '#cc0000');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#990000'; 
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight for 3D effect
    ctx.beginPath();
    ctx.arc(-balloon.radius/3, -balloon.radius/3, balloon.radius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    ctx.restore();
}


function drawObstacles() {
    obstacles.forEach(obstacle => {

        const gradientTop = ctx.createLinearGradient(
            obstacle.x, 0,
            obstacle.x + obstacleWidth, 0
        );
        gradientTop.addColorStop(0, '#ff9f40');
        gradientTop.addColorStop(1, '#ff7b00');
        
        ctx.fillStyle = gradientTop;
        ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.gapY);
        

        const gradientBottom = ctx.createLinearGradient(
            obstacle.x, obstacle.gapY + gapHeight,
            obstacle.x + obstacleWidth, canvas.height
        );
        gradientBottom.addColorStop(0, '#ff9f40');
        gradientBottom.addColorStop(1, '#ff7b00');
        
        ctx.fillStyle = gradientBottom;
        ctx.fillRect(
            obstacle.x,
            obstacle.gapY + gapHeight,
            obstacleWidth,
            canvas.height - (obstacle.gapY + gapHeight)
        );


        ctx.beginPath();
        ctx.arc(obstacle.x + obstacleWidth/2, obstacle.gapY, obstacleWidth/2, 0, Math.PI, true);
        ctx.fillStyle = '#ff7b00';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(obstacle.x + obstacleWidth/2, obstacle.gapY + gapHeight, obstacleWidth/2, Math.PI, Math.PI * 2, true);
        ctx.fillStyle = '#ff7b00';
        ctx.fill();
    });
}


function drawClouds() {
    clouds.forEach(cloud => {
        ctx.drawImage(cloud.image, cloud.x, cloud.y);
    });
}


function drawInstructions() {
    if (!showInstructions) return;


    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    const boxWidth = 400;
    const boxHeight = 200;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;


    ctx.fillStyle = 'white';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);


    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', canvas.width/2, boxY + 50);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE BAR to make the balloon rise!', canvas.width/2, boxY + 90);

    drawMiniBallon(canvas.width/2, boxY + 130);
    

    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Starting in: ${instructionTimer}`, canvas.width/2, boxY + 170);
}


function drawMiniBallon(x, y) {

    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x, y + 25);
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Mini balloon body
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        x - 5, y - 5, 4,
        x, y, 15
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#c92a2a');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
}


function update() {
    if (!gameRunning) return;

    updateBalloon();


    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
    }

    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSpeed;


        if (!obstacle.passed && obstacle.x + obstacleWidth < balloon.x) {
            score++;
            obstacle.passed = true;
            addScoreEffect(score);
        }


        if (obstacle.x + obstacleWidth < 0) {
            obstacles.splice(index, 1);
        }


        if (checkCollision(obstacle)) {
            gameOver();
        }
    });


    cloudTimer++;
    if (cloudTimer > 100) {
        createCloud();
        cloudTimer = 0;
    }

    clouds.forEach((cloud, index) => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.image.width < 0) {
            clouds.splice(index, 1);
        }
    });
}


function checkCollision(obstacle) {
    const balloonRight = balloon.x + balloon.radius * 0.8; 
    const balloonLeft = balloon.x - balloon.radius * 0.8;  
    const balloonTop = balloon.y - balloon.radius * 0.8;   
    const balloonBottom = balloon.y + balloon.radius * 0.8;

    return (
        balloonRight > obstacle.x &&
        balloonLeft < obstacle.x + obstacleWidth &&
        (balloonTop < obstacle.gapY || balloonBottom > obstacle.gapY + gapHeight)
    );
}


function updateScore() {
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    
    scoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

function gameOver() {
    gameRunning = false;


    const flash = document.createElement('div');
    flash.className = 'game-over-flash';
    document.getElementById('gameContainer').appendChild(flash);

    setTimeout(() => {
        flash.remove();
        showGameOverMenu();
    }, 500);
}

function showGameOverMenu() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScore;
    
    const menu = document.getElementById('menu');
    menu.style.display = 'block';
    menu.classList.add('show');
}


function restartGame() {
    balloon.y = canvas.height / 2;
    balloon.velocity = 0;
    obstacles.length = 0;
    clouds.length = 0;
    score = 0;
    obstacleTimer = 0;
    cloudTimer = 0;
    menu.style.display = 'none';
    showInstructions = true;
    instructionTimer = 3;
    startInstructionCountdown();
}

function startInstructionCountdown() {
    const countdownInterval = setInterval(() => {
        instructionTimer--;
        if (instructionTimer <= 0) {
            clearInterval(countdownInterval);
            showInstructions = false;
            gameRunning = true;
        }
    }, 1000);
}

function updateBalloon() {
    balloon.rotation += balloon.swayAmount;

    if (balloon.isRising) {
        balloon.riseSpeed = Math.max(
            balloon.riseSpeed + balloon.liftAcceleration,
            balloon.maxLift
        );
        balloon.velocity = balloon.riseSpeed;
    } else {
        balloon.riseSpeed = 0;
        balloon.velocity += balloon.gravity;
    }

    balloon.velocity *= balloon.drag;

    const maxFallSpeed = 5;
    balloon.velocity = Math.min(balloon.velocity, maxFallSpeed);


    balloon.y += balloon.velocity;


    balloon.x += Math.sin(balloon.rotation) * 0.3;
    

    if (balloon.x < balloon.radius) {
        balloon.x = balloon.radius;
    } else if (balloon.x > canvas.width - balloon.radius) {
        balloon.x = canvas.width - balloon.radius;
    }


    if (balloon.y + balloon.radius > canvas.height) {
        balloon.y = canvas.height - balloon.radius;
        balloon.velocity = 0;
        gameOver();
    } else if (balloon.y - balloon.radius < 0) {
        balloon.y = balloon.radius;
        balloon.velocity = Math.abs(balloon.velocity) * 0.5;
    }
}

function handleInput(e) {
    if (showInstructions || !gameRunning) return;
    
    if (e.type === 'keydown' && e.code === 'Space') {
        if (!balloon.isRising) {
            balloon.isRising = true;
            addLiftEffect();
        }
        e.preventDefault();
    } else if (e.type === 'keyup' && e.code === 'Space') {
        balloon.isRising = false;
        e.preventDefault();
    } else if (e.type === 'mousedown' || e.type === 'touchstart') {
        balloon.isRising = true;
        addLiftEffect();
        e.preventDefault();
    } else if (e.type === 'mouseup' || e.type === 'touchend') {
        balloon.isRising = false;
        e.preventDefault();
    }
}

function addLiftEffect() {
    const particles = [];
    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: balloon.x,
            y: balloon.y + balloon.radius,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 1.5 + 1,
            alpha: 0.7,
            size: Math.random() * 2 + 1
        });
    }

    function drawParticles() {
        let hasActiveParticles = false;

        particles.forEach(particle => {
            if (particle.alpha <= 0) return;

            hasActiveParticles = true;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
            ctx.fill();

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.01; // Slower fade
        });

        if (hasActiveParticles) {
            requestAnimationFrame(drawParticles);
        }
    }

    drawParticles();
}
function drawRisingIndicator() {
    if (balloon.isRising) {
        ctx.save();
        ctx.translate(balloon.x, balloon.y - balloon.radius - 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, -12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawPathGuide(); 
    drawClouds();
    drawObstacles();
    drawBalloon();
    drawRisingIndicator();
    drawSpaceBarPrompt();
    
    if (showInstructions) {
        drawInstructions();
    } else {
        update();
    }
    
    requestAnimationFrame(gameLoop);
}


document.addEventListener('keydown', handleInput);
document.addEventListener('keyup', handleInput);
document.addEventListener('mousedown', handleInput);
document.addEventListener('mouseup', handleInput);
document.addEventListener('touchstart', handleInput);
document.addEventListener('touchend', handleInput);

// Add space key visual indicator
function drawSpaceBarPrompt() {
    if (!gameRunning || showInstructions) return;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to rise', canvas.width/2, 30);
}


function addScoreEffect(newScore) {
    updateScore();

    const effect = {
        value: '+1',
        x: balloon.x + 30,
        y: balloon.y,
        alpha: 1,
        scale: 1
    };

    function drawScoreEffect() {
        if (effect.alpha <= 0) return;

        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.scale(effect.scale, effect.scale);
        ctx.fillStyle = `rgba(255, 77, 77, ${effect.alpha})`;
        ctx.font = 'bold 24px Arial';
        ctx.fillText(effect.value, 0, 0);
        ctx.restore();

        effect.y -= 1.5;
        effect.alpha -= 0.02;
        effect.scale += 0.02;

        if (effect.alpha > 0) {
            requestAnimationFrame(drawScoreEffect);
        }
    }

    drawScoreEffect();
}

function drawPathGuide() {
    if (!gameRunning || showInstructions) return;
    
    obstacles.forEach(obstacle => {
        const centerY = obstacle.gapY + gapHeight/2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(balloon.x, balloon.y);
        ctx.lineTo(obstacle.x + obstacleWidth/2, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}


function animateScoreUpdate() {
    const scoreElement = document.getElementById('score');
    scoreElement.classList.add('updated');
    setTimeout(() => {
        scoreElement.classList.remove('updated');
    }, 300);
}


createCloudImages();
restartGame();
gameLoop();

const style = document.createElement('style');
style.textContent = `
    @keyframes menuAppear {
        from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
        }
        to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }

    #menu {
        animation: none;
    }
`;
document.head.appendChild(style);
 
 

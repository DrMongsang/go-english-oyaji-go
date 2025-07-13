const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲーム状態
let gameState = 'opening'; // 'opening', 'playing', 'gameOver'
let score = 0;
let gameSpeed = 1;
let highScore = localStorage.getItem('highScore') || 0;

// 画像の読み込み
const playerImage = new Image();
playerImage.src = 'player.png';

// パーティクル配列
let particles = [];
// 雲の配列
let clouds = [];
// 建物の配列
let buildings = [];

// プレイヤー
const player = {
    x: 50,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    color: '#fff',
    speed: 5,
    velocityY: 0,
    isJumping: false,
    animationFrame: 0
};

// 障害物
const obstacle = {
    x: canvas.width,
    y: canvas.height - 50,
    width: 30,
    height: 25,
    color: '#8B0000',
    speed: 5,
    type: 'umbrella',
    floatOffset: 0,
    rotation: 0
};

// 重力
const gravity = 0.5;

// キー入力
const keys = {};

// 雲を初期化
function initClouds() {
    clouds = [];
    for (let i = 0; i < 12; i++) { // 雲の数を増やす
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            width: Math.random() * 80 + 60, // サイズを大きく
            height: Math.random() * 30 + 20,
            speed: Math.random() * 0.3 + 0.1,
            opacity: Math.random() * 0.6 + 0.4 // 透明度を上げる (0.4-1.0)
        });
    }
}

// 建物を初期化
function initBuildings() {
    buildings = [];
    for (let i = 0; i < 6; i++) {
        buildings.push({
            x: i * 80,
            y: canvas.height - 120 - Math.random() * 50,
            width: 70,
            height: 120 + Math.random() * 50,
            speed: 0.2,
            color: i % 2 === 0 ? '#8B4513' : '#A0522D' // レンガ色
        });
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (gameState === 'opening' && e.key === ' ') {
        startGame();
    }
    
    if (gameState === 'gameOver' && e.key === ' ') {
        gameState = 'opening';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 雨滴の配列
let raindrops = [];

// 雨滴を初期化
function initRain() {
    raindrops = [];
    for (let i = 0; i < 100; i++) { // 小雨なので100個
        raindrops.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 2 + 1, // ゆっくりとした雨
            length: Math.random() * 8 + 5,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
}

// ゲーム開始
function startGame() {
    gameState = 'playing';
    score = 0;
    gameSpeed = 1;
    particles = [];
    initClouds();
    initBuildings();
    initRain(); // 雨を初期化
    
    player.x = 50;
    player.y = canvas.height - 50;
    player.velocityY = 0;
    player.isJumping = false;
    player.animationFrame = 0;
    
    obstacle.x = canvas.width;
}

// ゲームオーバー
function gameOver() {
    gameState = 'gameOver';
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
}

// パーティクル作成
function createParticle(x, y) {
    particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * -3,
        life: 30,
        maxLife: 30
    });
}

// タッチ操作用の変数
let touchControls = {
    left: false,
    right: false,
    jump: false
};

// スマホ判定
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// タッチイベントの設定
function setupTouchControls() {
    if (!isMobile()) return;
    
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    
    // 左ボタン
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.left = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls.left = false;
    });
    
    // 右ボタン
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.right = true;
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls.right = false;
    });
    
    // ジャンプボタン
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.jump = true;
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls.jump = false;
    });
    
    // タッチでゲーム開始・リスタート
    jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameState === 'opening') {
            startGame();
        } else if (gameState === 'gameOver') {
            gameState = 'opening';
        }
    });
}

// update関数内のプレイヤー移動部分を修正
function update() {
    if (gameState !== 'playing') return;
    
    gameSpeed += 0.001;
    
    // 雲の移動
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed * gameSpeed;
        if (cloud.x < -cloud.width) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * (canvas.height / 2);
        }
    });
    
    // 雨滴の移動
    raindrops.forEach(drop => {
        drop.y += drop.speed;
        drop.x -= 0.5; // 少し斜めに降る
        
        // 画面下に到達したら上に戻す
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
        
        // 画面左に出たら右に戻す
        if (drop.x < 0) {
            drop.x = canvas.width;
        }
    });
    
    // 建物の移動
    buildings.forEach(building => {
        building.x -= building.speed * gameSpeed;
        if (building.x < -building.width) {
            building.x = canvas.width;
        }
    });
    
    // プレイヤーの移動（キーボード + タッチ対応）
    if ((keys['ArrowLeft'] || touchControls.left) && player.x > 0) {
        player.x -= player.speed;
        createParticle(player.x + player.width, player.y + player.height);
    }
    if ((keys['ArrowRight'] || touchControls.right) && player.x < canvas.width - player.width) {
        player.x += player.speed;
        createParticle(player.x, player.y + player.height);
    }

    // ジャンプ（キーボード + タッチ対応）
    if ((keys['ArrowUp'] || touchControls.jump) && !player.isJumping) {
        player.velocityY = -12;
        player.isJumping = true;
        touchControls.jump = false; // タッチジャンプは一回だけ
        for(let i = 0; i < 5; i++) {
            createParticle(player.x + Math.random() * player.width, player.y + player.height);
        }
    }

    // 重力
    player.y += player.velocityY;
    player.velocityY += gravity;

    // 地面との接触
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    player.animationFrame += 0.2;

    // フライング・アンブレラの移動と動き
    obstacle.x -= obstacle.speed * gameSpeed;
    obstacle.floatOffset += 0.1;
    obstacle.rotation += 0.05;
    
    // 上下にふわふわ浮く動き
    const baseY = canvas.height - 80;
    obstacle.y = baseY + Math.sin(obstacle.floatOffset) * 20;
    
    if (obstacle.x < -obstacle.width) {
        obstacle.x = canvas.width + Math.random() * 200;
        score++;
        // ランダムな高さで再出現
        obstacle.y = Math.random() * (canvas.height - 150) + 50;
    }

    // パーティクル更新
    particles = particles.filter(particle => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.1;
        particle.life--;
        return particle.life > 0;
    });

    // 当たり判定
    if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
    ) {
        gameOver();
    }
}

function drawOpening() {
    // イギリス風の空（雨雲っぽく）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#708090'); // より暗いグレー
    gradient.addColorStop(0.6, '#2F4F4F');
    gradient.addColorStop(1, '#1C1C1C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 雨を描画
    raindrops.forEach(drop => {
        ctx.strokeStyle = `rgba(173, 216, 230, ${drop.opacity})`; // 薄い青
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.stroke();
    });
    
    // 製作者クレジット（ファミコン風）
    ctx.fillStyle = '#FFD700'; // 金色
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FUJIMON GAMES', canvas.width / 2, 30);
    
    // タイトル（ユニオンジャックカラー）
    ctx.fillStyle = '#C8102E'; // 赤
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GO ENGLISH OYAJI GO', canvas.width / 2, canvas.height / 2 - 50);
    
    // サブタイトル
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('Jump through London rain!', canvas.width / 2, canvas.height / 2 - 10);
    
    // 操作説明
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('← → : Move', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('↑ : Jump', canvas.width / 2, canvas.height / 2 + 35);
    
    // スタート指示
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.fillStyle = '#C8102E';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO START', canvas.width / 2, canvas.height / 2 + 70);
    }
    
    // ハイスコア表示
    ctx.fillStyle = '#012169';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('HIGH SCORE: ' + highScore, canvas.width / 2, canvas.height / 2 + 100);
    
    ctx.textAlign = 'left';
}

function drawGame() {
    // イギリス風の雨空
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#708090');
    gradient.addColorStop(0.6, '#2F4F4F');
    gradient.addColorStop(1, '#1C1C1C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 建物を描画（レンガ風）
    buildings.forEach(building => {
        ctx.globalAlpha = 0.9; // 雨で少し見えにくく
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // レンガのテクスチャ
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let y = building.y; y < building.y + building.height; y += 10) {
            ctx.beginPath();
            ctx.moveTo(building.x, y);
            ctx.lineTo(building.x + building.width, y);
            ctx.stroke();
        }
        
        // 窓
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < Math.floor(building.height / 30); j++) {
                ctx.fillRect(
                    building.x + 10 + i * 20,
                    building.y + 10 + j * 30,
                    8, 12
                );
            }
        }
        ctx.globalAlpha = 1.0;
    });

    // 雲を描画（雨雲として）
    clouds.forEach(cloud => {
        ctx.fillStyle = `rgba(105, 105, 105, ${cloud.opacity * 0.8})`; // 暗いグレーの雲
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width/2, cloud.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // 雨を描画
    raindrops.forEach(drop => {
        ctx.strokeStyle = `rgba(173, 216, 230, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.stroke();
    });

    // スコアの描画
    ctx.fillStyle = '#C8102E';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillText('SCORE: ' + score, 10, 30);
    
    // スピード表示
    ctx.fillStyle = '#012169';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('SPEED: ' + gameSpeed.toFixed(1) + 'x', 10, 50);

    // パーティクル描画（金色）
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fillRect(particle.x, particle.y, 2, 2);
    });

    // プレイヤーの描画
    const bounceY = Math.sin(player.animationFrame) * 2;
    if (playerImage.complete && playerImage.naturalWidth > 0) {
        ctx.drawImage(playerImage, player.x, player.y + bounceY, player.width, player.height);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y + bounceY, player.width, player.height);
    }

    // フライング・アンブレラの描画
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
    ctx.rotate(obstacle.rotation);
    
    // 傘の柄
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, 5, 4, 15);
    
    // 傘の布部分（半円）- ネイビーに変更
    ctx.fillStyle = '#191970'; // ネイビーブルー
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI);
    ctx.fill();
    
    // 傘の骨組み
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 7) * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        ctx.stroke();
    }
    
    // 風のエフェクト（小さな線）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const offsetX = -20 - i * 8;
        const offsetY = Math.sin(obstacle.floatOffset + i) * 5;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.lineTo(offsetX - 8, offsetY);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawGameOver() {
    // ゲームオーバー画面のオーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ゲームオーバーテキスト
    ctx.fillStyle = '#C8102E';
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    // スコア表示
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('SCORE: ' + score, canvas.width / 2, canvas.height / 2 - 10);
    
    // ハイスコア表示
    if (score === highScore) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        ctx.fillStyle = '#012169';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('HIGH SCORE: ' + highScore, canvas.width / 2, canvas.height / 2 + 20);
    }
    
    // リスタート指示
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.fillStyle = '#C8102E';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO RESTART', canvas.width / 2, canvas.height / 2 + 60);
    }
    
    ctx.textAlign = 'left';
}

function draw() {
    if (gameState === 'opening') {
        drawOpening();
    } else if (gameState === 'playing') {
        drawGame();
    } else if (gameState === 'gameOver') {
        drawGame();
        drawGameOver();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 初期化
initClouds();
initBuildings();
initRain(); // 雨を初期化
gameLoop();

// キャンバスサイズをレスポンシブに調整
function resizeCanvas() {
    if (isMobile()) {
        const maxWidth = window.innerWidth - 20;
        const maxHeight = window.innerHeight * 0.6;
        const aspectRatio = 800 / 400;
        
        if (maxWidth / aspectRatio <= maxHeight) {
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = (maxWidth / aspectRatio) + 'px';
        } else {
            canvas.style.width = (maxHeight * aspectRatio) + 'px';
            canvas.style.height = maxHeight + 'px';
        }
    }
}

// 初期化時にタッチ操作とリサイズを設定
window.addEventListener('load', () => {
    setupTouchControls();
    resizeCanvas();
});

window.addEventListener('resize', resizeCanvas);

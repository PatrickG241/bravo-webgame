const SESSION_SCORE_KEY = 'bravo-webgame-session-score';
const SESSION_BEST_KEY = 'bravo-webgame-session-best';
const LEADERBOARD_KEY = 'bravo-webgame-leaderboard';
const FLAG_THRESHOLDS = [25, 50, 75, 100, 125, 150, 175, 200];

const gameState = {
  started: false,
  score: 0,
  distance: 0,
  speed: 1,
  lives: 3,
  lane: 1,
  obstacles: [],
  tickInterval: null,
  spawnInterval: null,
  highScore: 0,
  playerName: '',
};

const roadBoard = document.getElementById('roadBoard');
const vehicleElement = document.getElementById('vehicle');
const leftFlags = document.getElementById('leftFlags');
const rightFlags = document.getElementById('rightFlags');
const leaderboardList = document.getElementById('leaderboardList');
const playerNameInput = document.getElementById('playerName');
const gameStatus = document.getElementById('gameStatus');

const conceptState = {
  score: 0,
  best: Number(sessionStorage.getItem('bravo-concept-best') || 0),
  lane: 1,
  obstacleLane: 0,
};

function initPage() {
  if (document.body.dataset.page === 'concept') {
    initConceptGame();
    return;
  }

  initFullGame();
}

function initFullGame() {
  gameState.playerName = sanitizeName(sessionStorage.getItem('bravo-webgame-player') || '');
  if (gameState.playerName) {
    playerNameInput.value = gameState.playerName;
  }

  gameState.highScore = Number(sessionStorage.getItem(SESSION_BEST_KEY) || 0);
  renderFlags();
  renderLeaderboard();
  updateStats();
  bindEvents();
  updateStatus('Ready to race. Press start to begin.', 'info');
}

function bindEvents() {
  document.getElementById('startGameBtn').addEventListener('click', startGame);
  document.getElementById('resetGameBtn').addEventListener('click', resetGame);

  playerNameInput.addEventListener('input', function () {
    gameState.playerName = sanitizeName(this.value);
    sessionStorage.setItem('bravo-webgame-player', gameState.playerName);
    updatePlayerGreeting();
  });

  document.addEventListener('keydown', function (event) {
    if (!gameState.started) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      moveLeft();
      event.preventDefault();
    }

    if (event.key === 'ArrowRight') {
      moveRight();
      event.preventDefault();
    }
  });

  roadBoard.addEventListener('click', function (event) {
    if (!gameState.started) {
      return;
    }

    const boardRect = roadBoard.getBoundingClientRect();
    const clickX = event.clientX - boardRect.left;
    const laneWidth = boardRect.width / 3;
    const targetLane = Math.floor(clickX / laneWidth);
    gameState.lane = clamp(targetLane, 0, 2);
    updateCarPosition();
  });
}

function startGame() {
  if (gameState.started) {
    return;
  }

  gameState.started = true;
  gameState.score = 0;
  gameState.distance = 0;
  gameState.speed = 1;
  gameState.lives = 3;
  gameState.lane = 1;
  gameState.obstacles = [];
  updatePlayerGreeting();
  updateCarPosition();
  renderObstacles();
  renderFlags();
  updateStats();
  updateStatus('Drive safe and keep dodging!', 'success');

  gameState.tickInterval = window.setInterval(gameTick, 50);
  gameState.spawnInterval = window.setInterval(spawnObstacle, 1100);
}

function resetGame() {
  stopGame();
  gameState.started = false;
  gameState.score = 0;
  gameState.distance = 0;
  gameState.speed = 1;
  gameState.lives = 3;
  gameState.lane = 1;
  gameState.obstacles = [];
  updateCarPosition();
  renderObstacles();
  renderFlags();
  updateStats();
  updateStatus('Reset complete. Press start to drive again.', 'info');
}

function stopGame() {
  if (gameState.tickInterval) {
    window.clearInterval(gameState.tickInterval);
    gameState.tickInterval = null;
  }

  if (gameState.spawnInterval) {
    window.clearInterval(gameState.spawnInterval);
    gameState.spawnInterval = null;
  }
}

function gameTick() {
  if (!gameState.started) {
    return;
  }

  gameState.distance += 1;
  gameState.score += 1;

  if (gameState.distance % 90 === 0) {
    gameState.speed = 1 + Math.floor(gameState.distance / 90);
  }

  moveObstacles();
  updateStats();
  renderFlags();
  sessionStorage.setItem(SESSION_SCORE_KEY, String(gameState.score));
}

function spawnObstacle() {
  if (!gameState.started) {
    return;
  }

  const lane = Math.floor(Math.random() * 3);
  const obstacle = {
    id: Date.now() + Math.random(),
    lane,
    top: -18,
    speed: 2 + gameState.speed * 0.5,
  };

  gameState.obstacles.push(obstacle);
  renderObstacles();
}

function moveObstacles() {
  if (!gameState.started) {
    return;
  }

  const boardHeight = roadBoard.clientHeight;

  gameState.obstacles.forEach(function (obstacle) {
    obstacle.top += obstacle.speed;
  });

  gameState.obstacles = gameState.obstacles.filter(function (obstacle) {
    if (obstacle.top > 112) {
      return false;
    }

    if (detectCollision(obstacle, boardHeight)) {
      return false;
    }

    return true;
  });

  renderObstacles();
}

function detectCollision(obstacle, boardHeight) {
  if (obstacle.lane !== gameState.lane) {
    return false;
  }

  const carTop = boardHeight - 120;
  const obstacleTop = (obstacle.top / 100) * boardHeight;
  const overlap = Math.abs(obstacleTop - carTop) < 72;

  if (overlap) {
    gameState.lives -= 1;
    updateStatus('Crash! You hit an obstacle.', 'danger');

    if (gameState.lives <= 0) {
      endRun();
    }

    return true;
  }

  return false;
}

function renderObstacles() {
  document.querySelectorAll('.obstacle').forEach(function (node) {
    node.remove();
  });

  gameState.obstacles.forEach(function (obstacle) {
    const node = document.createElement('div');
    node.className = 'obstacle';
    node.style.left = `${13 + obstacle.lane * 31}%`;
    node.style.top = `${obstacle.top}%`;
    roadBoard.appendChild(node);
  });
}

function updateCarPosition() {
  const lanePositions = [12, 43, 74];
  vehicleElement.style.left = `${lanePositions[gameState.lane]}%`;
}

function moveLeft() {
  gameState.lane = clamp(gameState.lane - 1, 0, 2);
  updateCarPosition();
}

function moveRight() {
  gameState.lane = clamp(gameState.lane + 1, 0, 2);
  updateCarPosition();
}

function renderFlags() {
  leftFlags.innerHTML = '';
  rightFlags.innerHTML = '';

  FLAG_THRESHOLDS.forEach(function (threshold) {
    const isActive = gameState.distance >= threshold;
    const item = createFlagItem(threshold, isActive);
    leftFlags.appendChild(item.cloneNode(true));
    rightFlags.appendChild(item);
  });
}

function createFlagItem(threshold, isActive) {
  const item = document.createElement('div');
  item.className = 'flag-item' + (isActive ? ' active' : '');
  item.innerHTML =
    '<i class="bi bi-flag-fill"></i>' +
    '<div>' +
    '<div class="flag-label">Reached ' + threshold + ' points</div>' +
    '<div class="flag-value">' + (isActive ? 'Passed' : 'Ahead') + '</div>' +
    '</div>';
  return item;
}

function updateStats() {
  document.getElementById('gameScore').textContent = gameState.score;
  document.getElementById('gameDistance').textContent = gameState.distance;
  document.getElementById('gameSpeed').textContent = `${gameState.speed}x`;
  document.getElementById('highScore').textContent = gameState.highScore;
  document.getElementById('gameLives').textContent = gameState.lives;
  updatePlayerGreeting();
}

function updatePlayerGreeting() {
  const driver = gameState.playerName || 'Driver';
  const statusText = gameState.started ? 'Keep going' : 'Ready when you are';
  document.getElementById('greetPlayer').textContent = `Hello ${driver}! ${statusText}.`;
}

function updateStatus(message, tone) {
  gameStatus.textContent = message;
  gameStatus.className = 'badge';

  if (tone === 'success') {
    gameStatus.classList.add('text-bg-success');
    return;
  }

  if (tone === 'danger') {
    gameStatus.classList.add('text-bg-danger');
    return;
  }

  gameStatus.classList.add('text-bg-info');
}

function endRun() {
  stopGame();
  gameState.started = false;
  saveScore();
  renderLeaderboard();
  updateStatus('Game over. Tap start to try again.', 'danger');
  alert('Road run over! Your score: ' + gameState.score);
}

function saveScore() {
  const driver = gameState.playerName || 'Guest';
  const run = {
    name: driver,
    score: gameState.score,
    date: new Date().toISOString(),
  };

  sessionStorage.setItem(SESSION_SCORE_KEY, String(gameState.score));

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    sessionStorage.setItem(SESSION_BEST_KEY, String(gameState.highScore));
  }

  const leaderboard = readStorageList(LEADERBOARD_KEY, 'local');
  leaderboard.push(run);
  leaderboard.sort(function (a, b) {
    return b.score - a.score;
  });

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard.slice(0, 5)));
}

function renderLeaderboard() {
  const leaderboard = readStorageList(LEADERBOARD_KEY, 'local');
  if (!leaderboard.length) {
    leaderboardList.innerHTML = '<li class="list-group-item">No runs yet</li>';
    return;
  }

  leaderboardList.innerHTML = leaderboard.map(function (item) {
    const date = new Date(item.date);
    const label = isNaN(date.getTime()) ? 'Recent' : date.toLocaleDateString();
    return (
      '<li class="list-group-item d-flex justify-content-between align-items-start">' +
      '<div><strong>' + escapeHtml(item.name) + '</strong><div class="text-secondary small">' + label + '</div></div>' +
      '<span>' + item.score + '</span>' +
      '</li>'
    );
  }).join('');
}

function readStorageList(key, type) {
  try {
    const raw = type === 'local' ? localStorage.getItem(key) : sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function sanitizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initConceptGame() {
  const playerName = sanitizeName(sessionStorage.getItem('bravo-webgame-player') || '');
  if (playerName) {
    playerNameInput.value = playerName;
  }

  updateConceptGreeting();
  bindConceptEvents();
  resetConceptGame();
}

function bindConceptEvents() {
  document.getElementById('conceptMoveBtn').addEventListener('click', moveConceptObstacle);
  document.getElementById('conceptResetBtn').addEventListener('click', resetConceptGame);
  playerNameInput.addEventListener('input', function () {
    const value = sanitizeName(this.value);
    sessionStorage.setItem('bravo-webgame-player', value);
    updateConceptGreeting();
  });
}

function moveConceptObstacle() {
  const obstacleElement = document.getElementById('conceptObstacle');
  if (!obstacleElement) {
    return;
  }

  conceptState.lane = conceptState.lane === 1 ? 2 : 1;
  conceptState.obstacleLane = Math.floor(Math.random() * 3);
  updateConceptVehicle();
  updateConceptObstacle();

  if (conceptState.lane === conceptState.obstacleLane) {
    conceptState.score += 1;
    conceptState.best = Math.max(conceptState.best, conceptState.score);
    sessionStorage.setItem('bravo-concept-best', String(conceptState.best));
    updateConceptStatus('Nice dodge!', 'success');
  } else {
    conceptState.score = Math.max(0, conceptState.score - 1);
    updateConceptStatus('Close call!', 'danger');
  }

  updateConceptStats();
}

function resetConceptGame() {
  conceptState.score = 0;
  conceptState.lane = 1;
  conceptState.obstacleLane = Math.floor(Math.random() * 3);
  updateConceptVehicle();
  updateConceptObstacle();
  updateConceptStats();
  updateConceptStatus('Ready to dodge', 'info');
}

function updateConceptVehicle() {
  const vehicle = document.getElementById('conceptVehicle');
  if (!vehicle) {
    return;
  }

  const lanePositions = [12, 43, 74];
  vehicle.style.left = `${lanePositions[conceptState.lane]}%`;
}

function updateConceptObstacle() {
  const obstacle = document.getElementById('conceptObstacle');
  if (!obstacle) {
    return;
  }

  const lanePositions = [12, 43, 74];
  obstacle.style.left = `${lanePositions[conceptState.obstacleLane]}%`;
}

function updateConceptStats() {
  const scoreElement = document.getElementById('conceptScore');
  const bestElement = document.getElementById('conceptBest');
  if (scoreElement) {
    scoreElement.textContent = conceptState.score;
  }
  if (bestElement) {
    bestElement.textContent = conceptState.best;
  }
}

function updateConceptGreeting() {
  const driver = sanitizeName(sessionStorage.getItem('bravo-webgame-player') || '') || 'Guest';
  const greeting = document.getElementById('greetPlayer');
  if (greeting) {
    greeting.textContent = `Hello ${driver}!`;
  }
}

function updateConceptStatus(message, tone) {
  const status = document.getElementById('conceptStatus');
  if (!status) {
    return;
  }

  status.textContent = message;
  status.className = 'badge';
  if (tone === 'success') {
    status.classList.add('text-bg-success');
  } else if (tone === 'danger') {
    status.classList.add('text-bg-danger');
  } else {
    status.classList.add('text-bg-info');
  }
}

window.addEventListener('DOMContentLoaded', initPage);

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

const noteImg = new Image();
noteImg.src = 'Note.png';

// Game Physics 
let noteY       = 150;
let velocity    = 0;
const gravity   = 0.3;

// Game UI(buttons)
const buttons         = document.querySelectorAll(".note-buttons button");
const gameOverScreen  = document.getElementById("gameOverScreen");
const finalScoreText  = document.getElementById("finalScore");
const restartBtn      = document.getElementById("restartBtn");
function easeOutQuad(t) {
  return t * (2 - t);
}

// Animation 
function animateNoteJump(fromY, toY, duration, onComplete) {
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    let t = Math.min(elapsed / duration, 1);
    t = easeOutQuad(t);
    noteY = fromY + (toY - fromY) * t;
    drawFrame();
    if (elapsed < duration) {
      requestAnimationFrame(step);
    } else {
      noteY = toY; 
      onComplete();
    }
  }
  requestAnimationFrame(step);
}

// Draw 
function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1) note (character)
  const drawW = 25;  // Image Width
const drawH = 43;  // Imgae Height

ctx.drawImage(
  noteImg,
  50 - drawW / 2,
  noteY - drawH / 2, 
  drawW,
  drawH
);

  // 2) Walls/Obstacles
  ctx.fillStyle   = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth   = 2;
  ctx.fillRect(pipeX, 0, 40, pipeTop);
  ctx.strokeRect(pipeX, 0, 40, pipeTop);
  ctx.fillRect(pipeX, pipeTop + pipeGap, 40, canvas.height);
  ctx.strokeRect(pipeX, pipeTop + pipeGap, 40, canvas.height);
}

// Game Loop
let pipeX   = canvas.width;
const pipeGap = 100;
let pipeTop = Math.random() * 200 + 20;
let score       = 0;
let animationId = null;

function draw() {
  // physics
  velocity += gravity;
  noteY   += velocity;

  // move pipes & score
  pipeX -= 2;
  if (pipeX < -50) {
    pipeX   = canvas.width;
    pipeTop = Math.random() * 200 + 20;
    score++;
  }

  drawFrame();

  // collision
  const hitPipe =
    (50 + 15 > pipeX && 50 - 15 < pipeX + 40 &&
     (noteY - 15 < pipeTop || noteY + 15 > pipeTop + pipeGap));

  if (noteY < 0 || noteY > canvas.height || hitPipe) {
    return gameOver();
  }

  animationId = requestAnimationFrame(draw);
}

// Game mover
function gameOver() {
  cancelAnimationFrame(animationId);
  finalScoreText.textContent = "Score: " + score;
  gameOverScreen.style.display = "block";
}

// Restart Jump animation
function restartGame() {
  // hide overlay
  gameOverScreen.style.display = "none";

  // cancel any running loop
  cancelAnimationFrame(animationId);
  animateNoteJump(noteY, 150, 500, () => {
    // after animation completes, reset everything
    velocity = 0;
    pipeX    = canvas.width;
    pipeTop  = Math.random() * 200 + 20;
    score    = 0;
    draw();  // restart main loop
  });
}

// the note jump by absolute position
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const note = btn.textContent.trim().toUpperCase();

    // Pitch Button's Height
    const fractions = {
      'DO': 0.8,
      'RE': 0.7,
      'MI': 0.6,
      'FA': 0.5,
      'SO': 0.4,
      'LA': 0.3,
      'TI': 0.2
    };

    // compute targetY
    const targetY = canvas.height * (fractions[note] || 0.2);
    // TI→DO “dive then float up” behavior
    if (note === 'DO' && noteY > canvas.height * fractions['TI']) {
      // first glide down to just above the floor
      animateNoteJump(noteY, canvas.height - 15, 200, () => {
        // then float up to DO
        animateNoteJump(canvas.height - 15, targetY, 300, () => {
          velocity = 0;
        });
      });
    } else {
      // direct jump to the note’s band
      animateNoteJump(noteY, targetY, 300, () => {
        velocity = 0;
      });
    }
  });
});

// restart button
restartBtn.addEventListener("click", restartGame);
draw();
let handPose;
let video;
let hands = [];
let options = {flipped: true};

let questions = [
  {
    question: "這個小遊戲與哪堂課較相關？",
    choices: ["程式設計", "平面設計", "教學原理"],
    answer: "程式設計"
  },
  {
    question: "哪個語言常用於網頁前端互動？",
    choices: ["Python", "JavaScript", "Java"],
    answer: "JavaScript"
  },
  {
    question: "HTML 是什麼的縮寫？",
    choices: ["HighText Machine Language", "HyperText Markup Language", "HyperTool Multi Language"],
    answer: "HyperText Markup Language"
  }
];

let currentQuestionIndex = 0;
let choiceCircles = [];
let resultText = "";
let hasAnswered = false;
let score = 0;
let showResultScreen = false;
let particles = [];

function preload() {
  handPose = ml5.handPose(options);
}

function setup() {
  noCanvas();
  createCanvas(640, 480);
  let canvas = createCanvas(640, 480);
  canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
  canvas.style('display', 'block');
  document.body.style.backgroundColor = '#caf0f8';
  video = createCapture(VIDEO, {flipped: true});
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  setupChoices();
  textAlign(CENTER, CENTER);
}

function draw() {
  clear();
  background('#caf0f8');
  image(video, 0, 0, width, height);

  if (showResultScreen) {
    displayFinalResult();
    return;
  }

  let q = questions[currentQuestionIndex];

  // 顯示題目文字的半透明框
  fill(255, 200);
  noStroke();
  rect(width / 2 - 200, 50, 400, 60, 10); // 半透明框
  fill(0);
  textSize(20);
  text(q.question, width / 2, 80);

  for (let c of choiceCircles) {
    if (c.clicked) {
      fill(c.isCorrect ? "green" : "red");
    } else {
      fill(255, 150);
    }
    stroke(0);
    strokeWeight(2);
    ellipse(c.x, c.y, c.r * 2);

    fill(0);
    noStroke();
    textSize(16);
    text(c.text, c.x, c.y);
  }

  if (!hasAnswered && hands.length > 0) {
    let indexFinger = hands[0].keypoints[8];
    for (let c of choiceCircles) {
      let d = dist(indexFinger.x, indexFinger.y, c.x, c.y);
      if (d < c.r) {
        c.clicked = true;
        hasAnswered = true;
        resultText = c.isCorrect ? "✅ 正確！" : "❌ 錯誤！";
        if (c.isCorrect) score++;
        setTimeout(nextQuestion, 1500);
        break;
      }
    }
  }

  if (hasAnswered) {
    fill(0);
    textSize(28);
    text(resultText, width / 2, height - 80);
  }

  for (let hand of hands) {
    if (isHandOpen(hand)) {
      let palm = hand.keypoints[0];
      particles.push(new Particle(palm.x, palm.y - 20));
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function gotHands(results) {
  hands = results;
}

function isHandOpen(hand) {
  let base = hand.keypoints[0];
  let fingers = [8, 12, 16, 20];
  let openCount = 0;

  for (let i of fingers) {
    let tip = hand.keypoints[i];
    let d = dist(base.x, base.y, tip.x, tip.y);
    if (d > 80) openCount++;
  }
  return openCount >= 3;
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(1, 3));
    this.alpha = 255;
  }

  update() {
    this.pos.add(this.vel);
    this.alpha -= 2;
  }

  display() {
    noStroke();
    fill(color('#3a5a40'), this.alpha);
    textSize(20);
    text("教育科技", this.pos.x, this.pos.y);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

function setupChoices() {
  choiceCircles = [];
  let q = questions[currentQuestionIndex];
  let cx = width / 2;
  let cy = height / 2 + 50;
  let spacing = 150;

  for (let i = 0; i < q.choices.length; i++) {
    choiceCircles.push({
      x: cx + (i - 1) * spacing,
      y: cy,
      r: 60,
      text: q.choices[i],
      isCorrect: q.choices[i] === q.answer,
      clicked: false
    });
  }
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length) {
    showResultScreen = true;
    return;
  }
  hasAnswered = false;
  resultText = "";
  setupChoices();
}

function restartQuiz() {
  currentQuestionIndex = 0;
  hasAnswered = false;
  resultText = "";
  showResultScreen = false;
  score = 0;
  setupChoices();
}

function displayFinalResult() {
  // 顯示結算畫面的半透明框
  fill(255, 200);
  noStroke();
  rect(width / 2 - 250, 40, 500, 300, 10); // 半透明框

  fill(0);
  textSize(26);
  text("🎉 答題結束！", width / 2, 60);
  textSize(20);
  text("你的總分：" + score + " / " + questions.length, width / 2, 100);

  textSize(16);
  for (let i = 0; i < questions.length; i++) {
    let y = 150 + i * 50;
    text((i + 1) + ". " + questions[i].question, width / 2, y);
    text("正確答案： " + questions[i].answer, width / 2, y + 25);
  }

  fill(255, 150);
  stroke(0);
  strokeWeight(2);
  ellipse(width / 2, height - 60, 120, 60);

  fill(0);
  noStroke();
  textSize(16);
  text("🔁 重新開始", width / 2, height - 60);

  if (hands.length > 0) {
    let indexFinger = hands[0].keypoints[8];
    let d = dist(indexFinger.x, indexFinger.y, width / 2, height - 60);
    if (d < 60) {
      restartQuiz();
    }
  }
}

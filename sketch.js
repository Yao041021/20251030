let questions = [];
let currentQuestion = 0;
let score = 0;
let particles = [];
let table;
let buttonWidth = 300;
let buttonHeight = 50;
let isShowingResult = false;
let resultTimer = 0;
let optionsStartY = 0; // 實際繪製時儲存選項起始位置，供 mousePressed 使用

function preload() {
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  loadQuestionsFromCSV();
  textAlign(CENTER, CENTER);
  cursor('pointer');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function loadQuestionsFromCSV() {
  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    questions.push({
      question: row.getString('問題'),
      options: [
        row.getString('選項A'),
        row.getString('選項B'),
        row.getString('選項C'),
        row.getString('選項D')
      ],
      correct: row.getString('正確答案').charCodeAt(0) - 65
    });
  }
}

function draw() {
  background(240);

  // 每一幀重新計算按鈕大小與間距以支援響應式
  let minDim = min(width, height);
  buttonWidth = constrain(width * 0.7, minDim * 0.3, width * 0.95);
  buttonHeight = constrain(height * 0.09, 34, 120);
  if (!isShowingResult) {
    displayQuestion();
  } else {
    displayResult();
    resultTimer++;
    if (resultTimer > max(60, floor(30 + minDim / 4))) { // 停留時間隨畫面大小微調
      isShowingResult = false;
      resultTimer = 0;
      if (currentQuestion >= questions.length) {
        // 顯示最終分數（保留動畫），不停止 draw
        displayFinalScore();
        return;
      }
    }
  }
  // 在畫面底部顯示當前題數 / 總題數提醒
  displayFooter();

  // 滑鼠特效（根據畫面大小自動調整產生頻率）
  let freq = max(1, floor(4 - minDim / 300));
  if (frameCount % freq === 0) {
    particles.push(new Particle(mouseX, mouseY));
  }

  // 更新並顯示所有粒子（放在最後，確保在 displayResult 中新增的粒子能立即顯示）
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function displayQuestion() {
  if (currentQuestion >= questions.length) {
    displayFinalScore();
    return;
  }

  let question = questions[currentQuestion];
  // 動態字型大小
  let minDim = min(width, height);
  // 初始字型、最小字型
  let qSizeMax = constrain(minDim * 0.04, 18, 40);
  let qSizeMin = 12;
  // 允許的標題區域最大高度（視窗上方比例）
  let titleAreaMaxH = height * 0.22; // 22% of height
  // 計算合適的字型大小，若過長則逐步縮小
  let qSize = qSizeMax;
  while (qSize >= qSizeMin) {
    let h = measureWrappedHeight(question.question, qSize, width * 0.9, 1.2);
    if (h <= titleAreaMaxH) break;
    qSize -= 1;
  }
  qSize = max(qSize, qSizeMin);
  let optSize = constrain(minDim * 0.03, 14, 24);

  // 顯示問題（固定在視窗上方正中，可換行）
  fill(0);
  textSize(qSize);
  textWrap(WORD);
  // 將標題明確置中並靠上顯示
  textAlign(CENTER, TOP);
  // 使用接近視窗頂端的固定相對偏移，調整為稍大以避免和選項重疊
  let titleY = max(12, floor(height * 0.1));
  // 畫標題底色（可視化，避免被背景干擾）
  let titleW = width * 0.9;
  let titleH = measureWrappedHeight(question.question, qSize, titleW, 1.2);
  noStroke();
  fill(255, 255, 255, 220);
  // 使用 CENTER 模式畫背景，但之後恢復為 CORNER（預設）以免影響選項的位置
  rectMode(CENTER);
  rect(width/2, titleY + titleH/2, titleW + 12, titleH + 12, 8);
  // 實際文字
  fill(0);
  text(question.question, width/2, titleY, titleW);
  // 恢復預設對齊與 rectMode 以供下方選項使用
  textAlign(CENTER, CENTER);
  rectMode(CORNER);


// 估算換行後文字高度（使用 textWidth 模擬換行）
function measureWrappedHeight(txt, fontSize, maxWidth, lineHeightMult) {
  textSize(fontSize);
  let words = txt.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    let test = line ? line + ' ' + words[i] : words[i];
    let w = textWidth(test);
    if (w > maxWidth && line !== '') {
      lines++;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line !== '') lines++;
  let lineHeight = fontSize * lineHeightMult;
  return lines * lineHeight;
}
  // 選項使用相對位置與間距，起始 Y 由標題底部動態決定，避免被標題遮蓋
  // 增加標題下方的間距（再提高），確保選項不會被標題或其背景蓋住
  // 增加最小間距以避免標題與選項過於靠近
  let paddingAfterTitle = max(80, floor(height * 0.08));
  let startY = titleY + titleH + paddingAfterTitle;
  // 儲存實際起始 Y，讓 mousePressed 使用一致的判斷
  optionsStartY = startY;
  // 增加選項間距的最小值，讓每個選項有更寬敞的間隔
  let spacing = constrain(height * 0.12, 64, 160);
  let left = width/2 - buttonWidth/2;

  for (let i = 0; i < 4; i++) {
    let y = startY + i * spacing;
    let isHover = mouseX > left && mouseX < left + buttonWidth && mouseY > y - buttonHeight/2 && mouseY < y + buttonHeight/2;

    // 按鈕特效
    if (isHover) {
      fill(100, 200, 100); // 綠色懸停效果
      stroke(50, 150, 50);
      strokeWeight(3);
    } else {
      fill(255);
      stroke(200);
      strokeWeight(1);
    }

    rect(left, y - buttonHeight/2, buttonWidth, buttonHeight, 10);

    fill(0);
    noStroke();
    textSize(optSize);
    textAlign(LEFT, CENTER);
    text(String.fromCharCode(65 + i) + ". " + question.options[i], left + 18, y, buttonWidth - 36);
    textAlign(CENTER, CENTER);
  }
}

function displayResult() {
  background(240);
  textSize(32);
  textAlign(CENTER, CENTER);
  
  if (questions[currentQuestion-1].correct === lastAnswer) {
    // 如果是剛開始顯示結果，立即產生大量圈圈
    if (resultTimer === 0) {
      for (let i = 0; i < 20; i++) {
        particles.push(new CircleParticle(random(width)));
      }
    }
    
    // 顯示"答對了"
    fill(0, 255, 0);
    // 將文字位置調整到畫面中央偏上的位置
    text("答對了！", width/2, height * 0.4);
    
    // 持續產生少量圈圈維持效果
    if (resultTimer < 45 && frameCount % 3 === 0) {
      particles.push(new CircleParticle(random(width)));
    }
  } else {
    // 如果是剛開始顯示結果，立即產生大量叉叉
    if (resultTimer === 0) {
      for (let i = 0; i < 20; i++) {
        particles.push(new CrossParticle(random(width)));
      }
    }
    
    // 顯示"答錯了"和正確答案
    fill(255, 0, 0);
    let correctAns = String.fromCharCode(65 + questions[currentQuestion-1].correct);
    // 將文字位置調整到畫面中央偏上的位置
    text("答錯了！", width/2, height * 0.35);
    text("正確答案是：" + correctAns, width/2, height * 0.45);
    
    // 持續產生少量叉叉維持效果
    if (resultTimer < 45 && frameCount % 3 === 0) {
      particles.push(new CrossParticle(random(width)));
    }
  }
}

function displayFinalScore() {
  background(240);
  textSize(32);
  fill(0);
  text("測驗完成！", width/2, height/2 - 100);
  
  // 顯示總分
  text("總分：" + score + " / " + questions.length, width/2, height/2 - 20);
  
  // 計算並顯示得分率
  let scoreRate = (score / questions.length * 100).toFixed(1);
  text("得分率：" + scoreRate + "%", width/2, height/2 + 60);
  
  // 繪製重新開始按鈕
  let btnWidth = 200;
  let btnHeight = 50;
  let btnX = width/2 - btnWidth/2;
  let btnY = height/2 + 140;
  
  // 檢查滑鼠是否在按鈕上
  let isHover = mouseX > btnX && mouseX < btnX + btnWidth && 
                mouseY > btnY && mouseY < btnY + btnHeight;
  
  // 繪製按鈕
  if (isHover) {
    fill(100, 200, 100); // 綠色懸停效果
  } else {
    fill(200);
  }
  stroke(100);
  strokeWeight(2);
  rect(btnX, btnY, btnWidth, btnHeight, 10);
  
  // 按鈕文字
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text("重新開始", width/2, btnY + btnHeight/2);
  
  // 根據分數顯示不同的動畫
  if (score === questions.length) {
    showPerfectScore();
  } else if (score >= questions.length * 0.7) {
    showGoodScore();
  } else {
    showNeedsImprovement();
  }
}

// 在視窗底部繪製當前題數 / 總題數的小提醒
function displayFooter() {
  if (!questions || questions.length === 0) return;
  let padding = max(8, floor(height * 0.02));
  let fh = max(28, floor(height * 0.06));
  let fw = width * 0.4;
  let x = width/2 - fw/2;
  let y = height - fh - padding;

  // 半透明背景
  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 0, 0, 140);
  rect(x, y, fw, fh, 8);

  // 文字
  fill(255);
  textSize(constrain(fh * 0.45, 12, 20));
  textAlign(CENTER, CENTER);
  let displayIndex = min(currentQuestion + (isShowingResult ? 0 : 0), questions.length);
  // 當前題數：如果已答題並進到下一題，currentQuestion 已遞增，所以顯示 currentQuestion+1；
  // 但為了在答題畫面顯示 "第 X 題"，用 currentQuestion+1，超過總題數則顯示總題數
  let showNum = constrain(currentQuestion + 1, 1, questions.length);
  text(showNum + ' / ' + questions.length, x + fw/2, y + fh/2);
  pop();
}

let lastAnswer;

function mousePressed() {
  // 檢查是否在最終得分畫面並點擊了重新開始按鈕
  if (currentQuestion >= questions.length) {
    let btnWidth = 200;
    let btnHeight = 50;
    let btnX = width/2 - btnWidth/2;
    let btnY = height/2 + 140;
    
    if (mouseX > btnX && mouseX < btnX + btnWidth && 
        mouseY > btnY && mouseY < btnY + btnHeight) {
      // 重新開始：重置所有狀態並隨機打亂題目順序
      currentQuestion = 0;
      score = 0;
      isShowingResult = false;
      resultTimer = 0;
      particles = [];
      
      // 隨機打亂題目順序
      for (let i = questions.length - 1; i > 0; i--) {
        let j = floor(random(i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      return;
    }
    return;
  }

  if (isShowingResult) return;

  // 與 displayQuestion 使用相同的起始 Y（display 時已寫入 optionsStartY）
  let startY = optionsStartY || height * 0.28;
  let spacing = constrain(height * 0.12, 48, 140);
  let left = width/2 - buttonWidth/2;

  for (let i = 0; i < 4; i++) {
    let y = startY + i * spacing;
    if (mouseX > left && mouseX < left + buttonWidth && mouseY > y - buttonHeight/2 && mouseY < y + buttonHeight/2) {
      lastAnswer = i;
      if (i === questions[currentQuestion].correct) {
        score++;
      }
      currentQuestion++;
      isShowingResult = true;
      return;
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
    this.size = random(5, 15);
  }
    
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
    
  display() {
    noStroke();
    fill(100, 150, 255, this.alpha);
    circle(this.x, this.y, this.size);
  }
    
  isDead() {
    return this.alpha <= 0;
  }
}

class CrossParticle {
  constructor(x) {
    this.x = x;
    this.y = -20;
    this.vy = random(3, 7);
    this.vx = random(-1, 1);
    this.rotation = random(TWO_PI);
    this.rotSpeed = random(-0.1, 0.1);
    this.size = random(20, 40);
    this.alpha = 255;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    if (this.y > height + 50) {
      this.alpha -= 10;
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    stroke(255, 0, 0, this.alpha);
    strokeWeight(3);
    let halfSize = this.size / 2;
    line(-halfSize, -halfSize, halfSize, halfSize);
    line(-halfSize, halfSize, halfSize, -halfSize);
    pop();
  }

  isDead() {
    return this.alpha <= 0;
  }
}

class CircleParticle {
  constructor(x) {
    this.x = x;
    this.y = height + 20;
    this.vy = random(-7, -3);
    this.vx = random(-1, 1);
    this.size = random(20, 40);
    this.alpha = 255;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -50) {
      this.alpha -= 10;
    }
  }

  display() {
    noFill();
    stroke(0, 255, 0, this.alpha);
    strokeWeight(3);
    circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

function celebrateCorrect() {
  for (let i = 0; i < 5; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 5);
    particles.push(new Particle(
      width/2 + cos(angle) * 100,
      height/2 + sin(angle) * 100
    ));
  }
}

function showEncouragement() {
  stroke(255, 100, 100);
  strokeWeight(3);
  noFill();
  let size = sin(frameCount * 0.1) * 20 + 100;
  circle(width/2, height/2 + 100, size);
}

function showPerfectScore() {
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(
      random(width),
      random(height)
    ));
  }
}

function showGoodScore() {
  let angle = frameCount * 0.05;
  for (let i = 0; i < 5; i++) {
    let x = width/2 + cos(angle + i * TWO_PI/5) * 100;
    let y = height/2 + sin(angle + i * TWO_PI/5) * 100;
    fill(100, 200, 255);
    noStroke();
    star(x, y, 20, 10, 5);
  }
}

function showNeedsImprovement() {
  let size = sin(frameCount * 0.05) * 20 + 50;
  stroke(255, 150, 150);
  strokeWeight(2);
  noFill();
  heart(width/2, height/2, size);
}

function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle/2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a+halfAngle) * radius1;
    sy = y + sin(a+halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function heart(x, y, size) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.01) {
    let r = (2-2*sin(a) + sin(a)*sqrt(abs(cos(a)))/(sin(a)+1.4)) * size;
    let sx = x + cos(a) * r;
    let sy = y + sin(a) * r;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

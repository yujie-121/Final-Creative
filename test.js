let font, newShape, shape, size, hierarchy, shapes, x, y, heading, armPos, offset, pendulumTrailPaths, maxArms, margin, pendulumArm, lineLength, showPath, resolution, pos, joints, showPendulumPath, firstFrame, currentIndex, posIndex, currentPos, gravity, previousPos, damping, showPrinterPath, offsetPos, frame, armSizeDeviation, contentIndex, armSize, showPendulum, letter, letterSize, content, angle, centerPos;

content = '';
let isTextInserted = false; // Flag to track if text is inserted

function colour_rgb_alpha(rgb, alpha, maxalpha) {
  let a = Math.floor(alpha / maxalpha * 255);
  return color(rgb + hex(a, 2));
}

function mathRandomInt(a, b) {
  if (a > b) {
    let c = a;
    a = b;
    b = c;
  }
  return Math.floor(Math.random() * (b - a + 1) + a);
}

function clearCanvas() {
    background(255, 255, 255);  
    shapes = [];  // Reset the shapes array
    newShape = null;  // Clear any new shape being drawn
    isTextInserted = false;  // Reset the text inserted flag
  }

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255, 255, 255);
  colorMode(HSB, 360, 100, 100, 100);
  noFill();
  textFont('Arial', 20);  // Use the Arial system font
  strokeWeight(1);
  margin = 0;
  shapes = [];
  newShape = null;
  joints = 4;
  lineLength = 128;
  resolution = 0.04;
  gravity = 0.094;
  damping = 0.998;
  maxArms = 1;
  armSizeDeviation = 0.2;
  showPath = true;
  showPendulum = true;
  showPendulumPath = true;
  showPrinterPath = false;
}

function insertText() {
  let additionalText = document.getElementById('textInput').value.trim();
  document.getElementById('textInput').value = '';

  // Append additional text to the content variable
  content += ' ' + additionalText;

  // Display additional text content div
  document.getElementById('additionalText').innerText = content;
  document.getElementById('additionalText').style.display = 'block';

  // Set the flag to true since text is inserted
  isTextInserted = true;
}

function draw() {
    if (!isTextInserted) {
      return; // Exit draw() if no text is inserted or if the canvas is cleared
    }
  
    background('#ffffff'); // Clears the background before redrawing
    for (let shape of shapes) {
      shape.draw();
      shape.update();
    }
    if (newShape) {
      newShape.addPos(mouseX, mouseY);
      newShape.draw();
      newShape.update();
    }
  }  

class Shape {
  constructor(pendulumPathColor) {
    this.shapePath = [];
    this.pendulumPath = [];
    this.pendulumPathColor = pendulumPathColor;
    this.iterator = 0;
    this.lineLength = lineLength;
    this.resolution = resolution;
    this.pendulum = new Pendulum(this.lineLength, joints);
    this.shapeType = document.getElementById('shapeSelect').value;
  }

  addPos(x, y) {
    this.shapePath.push(createVector(x, y));
  }

  draw() {
    strokeWeight(0.8);
    stroke(colour_rgb_alpha('#000000', 10, 100));
    if (showPath) {
      if (this.shapeType === 'Circle') {
        ellipse(this.shapePath[0].x, this.shapePath[0].y, this.lineLength, this.lineLength);
      } else if (this.shapeType === 'Square') {
        rect(this.shapePath[0].x - this.lineLength / 2, this.shapePath[0].y - this.lineLength / 2, this.lineLength, this.lineLength);
      }
    }

    if (showPendulumPath && this.pendulumPath.length != 0) {
      strokeWeight(1);
      let firstFrame = this.pendulumPath[0];
      for (let posIndex = 0; posIndex < firstFrame.length; posIndex += 1) {
        if (showPrinterPath) {
          stroke(this.pendulumPathColor);
          beginShape();
          for (let frame of this.pendulumPath) {
            let pos = frame[posIndex];
            vertex(pos.x, pos.y);
          }
          endShape();
        }

        fill(this.pendulumPathColor);
        noStroke();
        previousPos = null;
        contentIndex = 1;
        for (let frame of this.pendulumPath) {
          let pos = frame[posIndex];
          let letter = content.charAt(contentIndex - 1);
          let letterSize = textWidth(letter);
          if (previousPos && p5.Vector.dist(pos, previousPos) >= letterSize + margin) {
            let angle = p5.Vector.sub(pos, previousPos).heading();
            let centerPos = p5.Vector.lerp(pos, previousPos, 0.5);

            push();
            translate(centerPos.x, centerPos.y);
            rotate(angle);
            text(letter, 0, 0);
            pop();

            contentIndex += 1;
            if (contentIndex > content.length) {
              contentIndex = 1;
            }
            previousPos = pos;
          }
          if (!previousPos) {
            previousPos = pos;
          }
        }
        noFill();
      }
    }

    if (this.shapePath.length >= 2 && this.iterator < this.shapePath.length - 1) {
      currentIndex = Math.floor(this.iterator);
      currentPos = this.shapePath[currentIndex + 1];
      previousPos = this.shapePath[currentIndex];
      offsetPos = p5.Vector.lerp(previousPos, currentPos, this.iterator - currentIndex);
      heading = p5.Vector.sub(currentPos, previousPos).heading();

      push();
      translate(offsetPos.x, offsetPos.y);
      this.pendulum.update(heading);
      if (showPendulum) {
        this.pendulum.draw();
      }
      this.pendulumPath.push(this.pendulum.getTrail(offsetPos));
      pop();
    }
  }

  update() {
    this.iterator += this.resolution;
    if (this.iterator > this.shapePath.length) {
      this.iterator = this.shapePath.length;
    }
  }
}

class Pendulum {
  constructor(size, hierarchy) {
    this.hierarchy = hierarchy - 1;
    this.armCount = mathRandomInt(1, maxArms);
    this.pendulumArms = [];
    this.size = size;
    this.angle = random(0, TWO_PI);
    this.origin = createVector(0, 0);
    this.end = createVector(0, 0);
    this.gravity = gravity;
    this.damping = damping;
    this.angularAcceleration = 0;
    this.angularVelocity = 0;
    if (this.hierarchy > 0) {
      for (let count = 0; count < this.armCount; count++) {
        let armSize = this.size / randomGaussian(1.5, armSizeDeviation);
        let pendulumArm = new Pendulum(armSize, this.hierarchy);
        this.pendulumArms.push(pendulumArm);
      }
    }
  }

  update(heading) {
    let armPos = p5.Vector.fromAngle(this.angle, this.size);
    this.end = p5.Vector.add(this.origin, armPos);
    this.angularAcceleration = (-this.gravity / this.size) * sin(this.angle + heading);
    this.angle += this.angularVelocity;
    this.angularVelocity += this.angularAcceleration;
    this.angularVelocity *= this.damping;
    for (let pendulumArm of this.pendulumArms) {
      pendulumArm.update(heading);
    }
  }

  getTrail(offset, pendulumTrailPaths = []) {
    offset = p5.Vector.add(offset, this.end);
    for (let pendulumArm of this.pendulumArms) {
      if (pendulumArm.pendulumArms.length > 0) {
        pendulumArm.getTrail(offset, pendulumTrailPaths);
      } else {
        pendulumTrailPaths.push(p5.Vector.add(offset, pendulumArm.end));
      }
    }
    return pendulumTrailPaths;
  }

  draw() {
    stroke(colour_rgb_alpha('#c0c0c0', 40, 100));
    line(this.origin.x, this.origin.y, this.end.x, this.end.y);
    fill(colour_rgb_alpha('#cccccc', 20, 100));
    ellipse(this.end.x, this.end.y, 2);
    noFill();
    for (let pendulumArm of this.pendulumArms) {
      push();
      translate(this.end.x, this.end.y);
      pendulumArm.draw();
      pop();
    }
  }
}

function mousePressed() {
  if (!isTextInserted) {
    return; // Exit mousePressed() if no text is inserted
  }

  newShape = new Shape(color(random(0, 360), 80, 60, 50));
  newShape.addPos(mouseX, mouseY);
}

function mouseReleased() {
  if (!isTextInserted) {
    return; // Exit mouseReleased() if no text is inserted
  }

  shapes.push(newShape);
  newShape = null;
}
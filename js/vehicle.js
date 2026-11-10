/**
 * Michelle De Santa 3D - 1930s Vintage Mafia Car ("De Santa V8")
 * Full arcade physics, working headlights, suspension lean, steering, and engine audio.
 */

class MafiaCar {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Car physics state
    this.position = this.group.position;
    this.rotation = this.group.rotation;
    this.speed = 0;
    this.maxSpeed = 22.0;
    this.reverseSpeed = -8.0;
    this.acceleration = 14.0;
    this.braking = 22.0;
    this.friction = 5.0;
    this.steerAngle = 0;
    this.maxSteerAngle = 0.55;
    this.steerSpeed = 2.8;

    this.isOccupied = false;
    this.headlightsOn = true;

    // Build the 3D car model
    this.buildCar();

    // Interaction prompt bubble
    this.createPromptBubble();

    // Exhaust particles
    this.exhaustPuffs = [];
  }

  buildCar() {
    this.carBodyGroup = new THREE.Group();
    this.group.add(this.carBodyGroup);

    // Materials
    const paintMat = new THREE.MeshStandardMaterial({
      color: 0x111317, // Deep noir gloss black
      roughness: 0.2,
      metalness: 0.8
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.15,
      metalness: 0.95
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x668899,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9
    });

    const whitewallMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.4
    });

    // 1. Main Chassis & Hood (Long vintage mafia roadster)
    const hoodGeo = new THREE.BoxGeometry(1.6, 0.7, 2.8);
    const hoodMesh = new THREE.Mesh(hoodGeo, paintMat);
    hoodMesh.position.set(0, 0.65, 0.6);
    hoodMesh.castShadow = true;
    this.carBodyGroup.add(hoodMesh);

    // Rounded Front Radiator Grille
    const grilleGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.65, 16);
    const grilleMesh = new THREE.Mesh(grilleGeo, chromeMat);
    grilleMesh.position.set(0, 0.65, 2.0);
    grilleMesh.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(grilleMesh);

    // Chrome Grille Slats
    const slatGeo = new THREE.BoxGeometry(0.7, 0.5, 0.05);
    const slatMesh = new THREE.Mesh(slatGeo, chromeMat);
    slatMesh.position.set(0, 0.65, 2.03);
    this.carBodyGroup.add(slatMesh);

    // 2. Cabin / Roof (Art Deco curved passenger cabin)
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.75, 1.8);
    const cabinMesh = new THREE.Mesh(cabinGeo, paintMat);
    cabinMesh.position.set(0, 1.25, -0.6);
    cabinMesh.castShadow = true;
    this.carBodyGroup.add(cabinMesh);

    // Split Windshield Glass
    const windGeo = new THREE.PlaneGeometry(1.35, 0.5);
    const windMesh = new THREE.Mesh(windGeo, glassMat);
    windMesh.position.set(0, 1.25, 0.31);
    windMesh.rotation.x = -0.15;
    this.carBodyGroup.add(windMesh);

    // Side Windows
    const sideWinGeo = new THREE.PlaneGeometry(1.5, 0.45);
    const leftWin = new THREE.Mesh(sideWinGeo, glassMat);
    leftWin.position.set(-0.76, 1.25, -0.6);
    leftWin.rotation.y = -Math.PI / 2;
    this.carBodyGroup.add(leftWin);

    const rightWin = new THREE.Mesh(sideWinGeo, glassMat);
    rightWin.position.set(0.76, 1.25, -0.6);
    rightWin.rotation.y = Math.PI / 2;
    this.carBodyGroup.add(rightWin);

    // Rear Trunk
    const trunkGeo = new THREE.BoxGeometry(1.55, 0.65, 1.2);
    const trunkMesh = new THREE.Mesh(trunkGeo, paintMat);
    trunkMesh.position.set(0, 0.65, -1.9);
    trunkMesh.castShadow = true;
    this.carBodyGroup.add(trunkMesh);

    // Spare wheel mounted on trunk (classic 1930s style!)
    const spareGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16);
    const spareMesh = new THREE.Mesh(spareGeo, tireMat);
    spareMesh.position.set(0, 0.8, -2.55);
    spareMesh.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(spareMesh);

    const spareCapGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.24, 16);
    const spareCap = new THREE.Mesh(spareCapGeo, chromeMat);
    spareCap.position.set(0, 0.8, -2.56);
    spareCap.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(spareCap);

    // Curved Fenders & Running Boards (Sides)
    const runningBoardGeo = new THREE.BoxGeometry(0.3, 0.08, 2.2);
    const leftBoard = new THREE.Mesh(runningBoardGeo, chromeMat);
    leftBoard.position.set(-0.95, 0.28, -0.2);
    this.carBodyGroup.add(leftBoard);

    const rightBoard = new THREE.Mesh(runningBoardGeo, chromeMat);
    rightBoard.position.set(0.95, 0.28, -0.2);
    this.carBodyGroup.add(rightBoard);

    // Curved Wheel Fenders
    const fenderGeo = new THREE.BoxGeometry(0.35, 0.38, 1.1);
    const fLeft = new THREE.Mesh(fenderGeo, paintMat);
    fLeft.position.set(-0.95, 0.55, 1.35);
    this.carBodyGroup.add(fLeft);

    const fRight = new THREE.Mesh(fenderGeo, paintMat);
    fRight.position.set(0.95, 0.55, 1.35);
    this.carBodyGroup.add(fRight);

    const rLeft = new THREE.Mesh(fenderGeo, paintMat);
    rLeft.position.set(-0.95, 0.55, -1.55);
    this.carBodyGroup.add(rLeft);

    const rRight = new THREE.Mesh(fenderGeo, paintMat);
    rRight.position.set(0.95, 0.55, -1.55);
    this.carBodyGroup.add(rRight);

    // Chrome Bumpers
    const bumperGeo = new THREE.BoxGeometry(1.9, 0.12, 0.12);
    const frontBumper = new THREE.Mesh(bumperGeo, chromeMat);
    frontBumper.position.set(0, 0.35, 2.15);
    this.carBodyGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(bumperGeo, chromeMat);
    rearBumper.position.set(0, 0.35, -2.58);
    this.carBodyGroup.add(rearBumper);

    // Headlights (Big round vintage buckets)
    const headlightGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 16);
    const hLeft = new THREE.Mesh(headlightGeo, chromeMat);
    hLeft.position.set(-0.65, 0.75, 1.95);
    hLeft.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(hLeft);

    const hRight = new THREE.Mesh(headlightGeo, chromeMat);
    hRight.position.set(0.65, 0.75, 1.95);
    hRight.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(hRight);

    // Headlight glowing lenses
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
    const lensGeo = new THREE.CircleGeometry(0.16, 16);
    const lensL = new THREE.Mesh(lensGeo, lensMat);
    lensL.position.set(-0.65, 0.75, 2.08);
    this.carBodyGroup.add(lensL);

    const lensR = new THREE.Mesh(lensGeo, lensMat);
    lensR.position.set(0.65, 0.75, 2.08);
    this.carBodyGroup.add(lensR);

    // Real Three.js Spotlights casting light forward!
    this.spotLightL = new THREE.SpotLight(0xfffae0, 2.2, 35, Math.PI / 5, 0.4, 1.5);
    this.spotLightL.position.set(-0.65, 0.75, 2.1);
    this.spotLightL.target.position.set(-0.65, 0.2, 15);
    this.carBodyGroup.add(this.spotLightL);
    this.carBodyGroup.add(this.spotLightL.target);

    this.spotLightR = new THREE.SpotLight(0xfffae0, 2.2, 35, Math.PI / 5, 0.4, 1.5);
    this.spotLightR.position.set(0.65, 0.75, 2.1);
    this.spotLightR.target.position.set(0.65, 0.2, 15);
    this.carBodyGroup.add(this.spotLightR);
    this.carBodyGroup.add(this.spotLightR.target);

    // Dual Exhaust Pipes
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
    pipeL.position.set(-0.45, 0.25, -2.6);
    pipeL.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(pipeL);

    const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
    pipeR.position.set(0.45, 0.25, -2.6);
    pipeR.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(pipeR);

    // 4 WHEELS (with front steering pivots)
    this.wheels = [];
    this.frontSteerPivots = [];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 18);
    const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.27, 16);

    const wheelConfigs = [
      { x: -0.92, y: 0.38, z: 1.35, isFront: true },
      { x: 0.92, y: 0.38, z: 1.35, isFront: true },
      { x: -0.92, y: 0.38, z: -1.55, isFront: false },
      { x: 0.92, y: 0.38, z: -1.55, isFront: false }
    ];

    wheelConfigs.forEach((cfg) => {
      const pivot = new THREE.Group();
      pivot.position.set(cfg.x, cfg.y, cfg.z);
      this.carBodyGroup.add(pivot);

      const wheelMesh = new THREE.Mesh(wheelGeo, tireMat);
      wheelMesh.rotation.z = Math.PI / 2;
      wheelMesh.castShadow = true;
      pivot.add(wheelMesh);

      const capMesh = new THREE.Mesh(capGeo, chromeMat);
      capMesh.rotation.z = Math.PI / 2;
      pivot.add(capMesh);

      this.wheels.push(wheelMesh);

      if (cfg.isFront) {
        this.frontSteerPivots.push(pivot);
      }
    });

    // Shadow disc under car
    const shadowGeo = new THREE.PlaneGeometry(2.4, 5.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55
    });
    this.carShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.carShadow.rotation.x = -Math.PI / 2;
    this.carShadow.position.y = 0.02;
    this.scene.add(this.carShadow);
  }

  createPromptBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(18, 20, 26, 0.9)';
    ctx.roundRect ? ctx.roundRect(8, 8, 240, 54, 12) : ctx.rect(8, 8, 240, 54);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[E] DRIVE V8 ROADSTER', 128, 42);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.promptSprite = new THREE.Sprite(mat);
    this.promptSprite.scale.set(2.4, 0.65, 1);
    this.promptSprite.position.set(0, 2.6, 0);
    this.promptSprite.visible = false;
    this.group.add(this.promptSprite);
  }

  update(dt, inputSteer, inputAccel, isHandbrake) {
    // Synchronize ground shadow
    this.carShadow.position.set(this.position.x, 0.02, this.position.z);
    this.carShadow.rotation.z = -this.rotation.y;

    if (!this.isOccupied) {
      // Natural slow deceleration when player is not driving
      if (Math.abs(this.speed) > 0.05) {
        this.speed -= Math.sign(this.speed) * this.friction * dt;
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        this.position.addScaledVector(forward, this.speed * dt);
      } else {
        this.speed = 0;
      }
      return;
    }

    // Steering input with smooth interpolation
    const targetSteer = -inputSteer * this.maxSteerAngle;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * this.steerSpeed * 3);

    // Apply front wheel visual turn
    this.frontSteerPivots.forEach(pivot => {
      pivot.rotation.y = this.steerAngle;
    });

    // Acceleration & Braking
    if (inputAccel > 0) {
      this.speed += this.acceleration * dt;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (inputAccel < 0) {
      if (this.speed > 0.5) {
        this.speed -= this.braking * dt;
      } else {
        this.speed -= this.acceleration * 0.7 * dt;
        if (this.speed < this.reverseSpeed) this.speed = this.reverseSpeed;
      }
    } else {
      // Natural rolling friction
      if (Math.abs(this.speed) > 0.1) {
        this.speed -= Math.sign(this.speed) * this.friction * dt;
      } else {
        this.speed = 0;
      }
    }

    // Handbrake drift
    if (isHandbrake) {
      this.speed -= Math.sign(this.speed) * this.braking * 1.5 * dt;
    }

    // Vehicle Turning based on speed and steer angle (Ackermann approximation)
    if (Math.abs(this.speed) > 0.2) {
      const turnFactor = (this.speed / this.maxSpeed) * this.steerAngle * 2.2;
      this.rotation.y += turnFactor * dt;

      // Suspension body roll (lean into turns like a real vintage cruiser)
      this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(
        this.carBodyGroup.rotation.z,
        -this.steerAngle * (this.speed / this.maxSpeed) * 0.15,
        dt * 8
      );
    } else {
      this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(this.carBodyGroup.rotation.z, 0, dt * 6);
    }

    // Apply movement
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    this.position.addScaledVector(forward, this.speed * dt);

    // Rotate wheels visually
    const wheelRotSpeed = (this.speed / 0.38) * dt;
    this.wheels.forEach(w => {
      w.rotation.x += wheelRotSpeed;
    });

    // Update car engine audio
    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    window.soundEngine.updateCarEngine(speedRatio);

    // Exhaust smoke puffs when accelerating
    if (inputAccel > 0 && Math.random() > 0.4) {
      this.emitExhaustPuff();
    }

    this.updateExhaustPuffs(dt);
  }

  emitExhaustPuff() {
    const puffGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 6, 6);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.6
    });
    const puff = new THREE.Mesh(puffGeo, puffMat);

    // Place at rear exhaust pipes
    const offset = new THREE.Vector3((Math.random() > 0.5 ? 0.45 : -0.45), 0.25, -2.7);
    offset.applyEuler(this.rotation).add(this.position);
    puff.position.copy(offset);
    puff.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      Math.random() * 0.8 + 0.3,
      (Math.random() - 0.5) * 0.4
    );

    this.scene.add(puff);
    this.exhaustPuffs.push({ mesh: puff, mat: puffMat, life: 0, maxLife: 0.5 });
  }

  updateExhaustPuffs(dt) {
    for (let i = this.exhaustPuffs.length - 1; i >= 0; i--) {
      const p = this.exhaustPuffs[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.multiplyScalar(1.05);
      p.mat.opacity = (1 - p.life / p.maxLife) * 0.5;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        this.exhaustPuffs.splice(i, 1);
      }
    }
  }

  honk() {
    window.soundEngine.playHorn();
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    this.spotLightL.visible = this.headlightsOn;
    this.spotLightR.visible = this.headlightsOn;
  }

  enterCar() {
    this.isOccupied = true;
    this.promptSprite.visible = false;
    window.soundEngine.startCarEngine();
  }

  exitCar() {
    this.isOccupied = false;
    this.speed = 0;
    window.soundEngine.stopCarEngine();
  }
}

window.MafiaCar = MafiaCar;

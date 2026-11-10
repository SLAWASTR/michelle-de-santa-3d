/**
 * Michelle De Santa 3D - Mafia Roadster V8 (GTA 3 Style)
 * Robust physics, zero crash bugs, door sound on enter/exit,
 * wall sliding collision, and visible driver.
 */

class MafiaCar {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.position = this.group.position;
    this.rotation = this.group.rotation;

    this.speed = 0;
    this.maxSpeed = 38.0;
    this.reverseSpeed = -15.0;
    this.acceleration = 35.0;
    this.braking = 46.0;
    this.friction = 4.2;

    this.steerAngle = 0;
    this.maxSteerAngle = 0.58;
    this.steerSpeed = 6.2;
    this.radius = 1.25;

    this.isOccupied = true;
    this.headlightsOn = true;

    this.gear = 1;
    this.rpm = 0.2;
    this.driftFactor = 0;

    this.exhaustPuffs = [];
    this.tireSmokes = [];
    this.skidMarks = [];
    this.sparks = [];

    this.buildCar();
    this.createPromptBubble();
  }

  buildCar() {
    this.carBodyGroup = new THREE.Group();
    this.group.add(this.carBodyGroup);

    // GTA 3 Mafia Sentinel / Roadster Materials
    const paintMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.15,
      metalness: 0.88
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.1,
      metalness: 0.98
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x446677,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.85
    });

    // 1. Long Hood
    const hoodGeo = new THREE.BoxGeometry(1.65, 0.72, 3.0);
    const hoodMesh = new THREE.Mesh(hoodGeo, paintMat);
    hoodMesh.position.set(0, 0.68, 0.7);
    hoodMesh.castShadow = true;
    this.carBodyGroup.add(hoodMesh);

    // Front Chrome Grille
    const grilleGeo = new THREE.CylinderGeometry(0.52, 0.58, 0.72, 20);
    const grilleMesh = new THREE.Mesh(grilleGeo, chromeMat);
    grilleMesh.position.set(0, 0.68, 2.2);
    grilleMesh.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(grilleMesh);

    const slatGeo = new THREE.BoxGeometry(0.74, 0.54, 0.06);
    const slatMesh = new THREE.Mesh(slatGeo, chromeMat);
    slatMesh.position.set(0, 0.68, 2.23);
    this.carBodyGroup.add(slatMesh);

    // Mascot
    const ornamentGeo = new THREE.ConeGeometry(0.04, 0.16, 8);
    const ornament = new THREE.Mesh(ornamentGeo, chromeMat);
    ornament.position.set(0, 1.1, 2.15);
    ornament.rotation.x = -Math.PI / 3;
    this.carBodyGroup.add(ornament);

    // 2. Cabin
    const cabinGeo = new THREE.BoxGeometry(1.55, 0.78, 1.85);
    const cabinMesh = new THREE.Mesh(cabinGeo, paintMat);
    cabinMesh.position.set(0, 1.26, -0.65);
    cabinMesh.castShadow = true;
    this.carBodyGroup.add(cabinMesh);

    // Split Windshield
    const windGeo = new THREE.PlaneGeometry(1.4, 0.55);
    const windMesh = new THREE.Mesh(windGeo, glassMat);
    windMesh.position.set(0, 1.28, 0.32);
    windMesh.rotation.x = -0.16;
    this.carBodyGroup.add(windMesh);

    const frameBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), chromeMat);
    frameBar.position.set(0, 1.28, 0.33);
    frameBar.rotation.x = -0.16;
    this.carBodyGroup.add(frameBar);

    // Side Windows
    const sideWinGeo = new THREE.PlaneGeometry(1.5, 0.48);
    const leftWin = new THREE.Mesh(sideWinGeo, glassMat);
    leftWin.position.set(-0.78, 1.28, -0.65);
    leftWin.rotation.y = -Math.PI / 2;
    this.carBodyGroup.add(leftWin);

    const rightWin = new THREE.Mesh(sideWinGeo, glassMat);
    rightWin.position.set(0.78, 1.28, -0.65);
    rightWin.rotation.y = Math.PI / 2;
    this.carBodyGroup.add(rightWin);

    // 3. Trunk & Spare Wheel
    const trunkGeo = new THREE.BoxGeometry(1.58, 0.68, 1.3);
    const trunkMesh = new THREE.Mesh(trunkGeo, paintMat);
    trunkMesh.position.set(0, 0.68, -2.0);
    trunkMesh.castShadow = true;
    this.carBodyGroup.add(trunkMesh);

    const spareGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.24, 20);
    const spareMesh = new THREE.Mesh(spareGeo, tireMat);
    spareMesh.position.set(0, 0.85, -2.7);
    spareMesh.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(spareMesh);

    const spareCap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.26, 18), chromeMat);
    spareCap.position.set(0, 0.85, -2.71);
    spareCap.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(spareCap);

    // 4. Running Boards & Fenders
    const runningBoardGeo = new THREE.BoxGeometry(0.32, 0.09, 2.3);
    const leftBoard = new THREE.Mesh(runningBoardGeo, chromeMat);
    leftBoard.position.set(-0.98, 0.28, -0.2);
    this.carBodyGroup.add(leftBoard);

    const rightBoard = new THREE.Mesh(runningBoardGeo, chromeMat);
    rightBoard.position.set(0.98, 0.28, -0.2);
    this.carBodyGroup.add(rightBoard);

    const fenderGeo = new THREE.BoxGeometry(0.36, 0.4, 1.15);
    const fLeft = new THREE.Mesh(fenderGeo, paintMat);
    fLeft.position.set(-0.98, 0.58, 1.45);
    this.carBodyGroup.add(fLeft);

    const fRight = new THREE.Mesh(fenderGeo, paintMat);
    fRight.position.set(0.98, 0.58, 1.45);
    this.carBodyGroup.add(fRight);

    const rLeft = new THREE.Mesh(fenderGeo, paintMat);
    rLeft.position.set(-0.98, 0.58, -1.65);
    this.carBodyGroup.add(rLeft);

    const rRight = new THREE.Mesh(fenderGeo, paintMat);
    rRight.position.set(0.98, 0.58, -1.65);
    this.carBodyGroup.add(rRight);

    // 5. Heavy Bumpers
    const bumperGeo = new THREE.BoxGeometry(1.95, 0.14, 0.14);
    const frontBumper = new THREE.Mesh(bumperGeo, chromeMat);
    frontBumper.position.set(0, 0.36, 2.35);
    this.carBodyGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(bumperGeo, chromeMat);
    rearBumper.position.set(0, 0.36, -2.75);
    this.carBodyGroup.add(rearBumper);

    // 6. Round Headlights
    const headlightGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.26, 18);
    const hLeft = new THREE.Mesh(headlightGeo, chromeMat);
    hLeft.position.set(-0.68, 0.78, 2.15);
    hLeft.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(hLeft);

    const hRight = new THREE.Mesh(headlightGeo, chromeMat);
    hRight.position.set(0.68, 0.78, 2.15);
    hRight.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(hRight);

    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfffaaa });
    const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.18, 18), lensMat);
    lensL.position.set(-0.68, 0.78, 2.29);
    this.carBodyGroup.add(lensL);

    const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.18, 18), lensMat);
    lensR.position.set(0.68, 0.78, 2.29);
    this.carBodyGroup.add(lensR);

    // Spotlights
    this.spotLightL = new THREE.SpotLight(0xfffae0, 3.2, 48, Math.PI / 4.5, 0.35, 1.4);
    this.spotLightL.position.set(-0.68, 0.78, 2.3);
    this.spotLightL.target.position.set(-0.68, 0.2, 22);
    this.carBodyGroup.add(this.spotLightL);
    this.carBodyGroup.add(this.spotLightL.target);

    this.spotLightR = new THREE.SpotLight(0xfffae0, 3.2, 48, Math.PI / 4.5, 0.35, 1.4);
    this.spotLightR.position.set(0.68, 0.78, 2.3);
    this.spotLightR.target.position.set(0.68, 0.2, 22);
    this.carBodyGroup.add(this.spotLightR);
    this.carBodyGroup.add(this.spotLightR.target);

    // Volumetric Light Beams
    const beamGeo = new THREE.CylinderGeometry(0.2, 2.0, 16, 18, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff6bb,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const beamL = new THREE.Mesh(beamGeo, beamMat);
    beamL.position.set(-0.68, 0.65, 10.2);
    beamL.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(beamL);

    const beamR = new THREE.Mesh(beamGeo, beamMat);
    beamR.position.set(0.68, 0.65, 10.2);
    beamR.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(beamR);
    this.volumetricBeams = [beamL, beamR];

    // Active Brake & Taillights
    this.tailLightMat = new THREE.MeshStandardMaterial({
      color: 0x550000,
      emissive: 0x220000,
      roughness: 0.2
    });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), this.tailLightMat);
    tailL.position.set(-0.7, 0.65, -2.68);
    this.carBodyGroup.add(tailL);

    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), this.tailLightMat);
    tailR.position.set(0.7, 0.65, -2.68);
    this.carBodyGroup.add(tailR);

    // Backup Reverse Lights (white)
    this.revLightMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x000000,
      roughness: 0.2
    });
    const revL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), this.revLightMat);
    revL.position.set(-0.48, 0.65, -2.68);
    this.carBodyGroup.add(revL);

    const revR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), this.revLightMat);
    revR.position.set(0.48, 0.65, -2.68);
    this.carBodyGroup.add(revR);

    // Dual Exhaust Pipes
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 10);
    const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
    pipeL.position.set(-0.48, 0.26, -2.75);
    pipeL.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(pipeL);

    const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
    pipeR.position.set(0.48, 0.26, -2.75);
    pipeR.rotation.x = Math.PI / 2;
    this.carBodyGroup.add(pipeR);

    // 7. Seated Driver (Michelle)
    this.driverMesh = this.createSeatedDriver();
    this.driverMesh.position.set(-0.35, 0.85, -0.6);
    this.carBodyGroup.add(this.driverMesh);

    // Steering Wheel
    const wheelTorus = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
    const steerWheel = new THREE.Mesh(wheelTorus, chromeMat);
    steerWheel.position.set(-0.35, 1.15, -0.15);
    steerWheel.rotation.x = 0.35;
    this.carBodyGroup.add(steerWheel);

    // 8. 4 Wheels
    this.wheels = [];
    this.frontSteerPivots = [];

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 20);
    const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.29, 16);

    const wheelConfigs = [
      { x: -0.96, y: 0.4, z: 1.45, isFront: true },
      { x: 0.96, y: 0.4, z: 1.45, isFront: true },
      { x: -0.96, y: 0.4, z: -1.65, isFront: false },
      { x: 0.96, y: 0.4, z: -1.65, isFront: false }
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
      if (cfg.isFront) this.frontSteerPivots.push(pivot);
    });

    // Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.5, 5.5);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
    this.carShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.carShadow.rotation.x = -Math.PI / 2;
    this.carShadow.position.y = 0.02;
    this.scene.add(this.carShadow);
  }

  createSeatedDriver() {
    const group = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfb090 });
    const fedoraMat = new THREE.MeshStandardMaterial({ color: 0x5a5e66, roughness: 0.7 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.25), suitMat);
    torso.position.y = 0.22;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.24), skinMat);
    head.position.y = 0.56;
    group.add(head);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 16), fedoraMat);
    hat.position.set(0, 0.7, 0.01);
    group.add(hat);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.18, 16), fedoraMat);
    crown.position.set(0, 0.8, 0.01);
    group.add(crown);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.04, 16), bandMat);
    band.position.set(0, 0.73, 0.01);
    group.add(band);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.32), suitMat);
    armL.position.set(-0.16, 0.3, 0.2);
    armL.rotation.x = -0.2;
    group.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.32), suitMat);
    armR.position.set(0.16, 0.3, 0.2);
    armR.rotation.x = -0.2;
    group.add(armR);

    return group;
  }

  createPromptBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(18, 20, 26, 0.92)';
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

  update(dt, inputSteer, inputAccel, isHandbrake, cityWorld) {
    // Keep ground shadow updated
    this.carShadow.position.set(this.position.x, 0.02, this.position.z);
    this.carShadow.rotation.z = -this.rotation.y;

    if (this.driverMesh) {
      this.driverMesh.visible = this.isOccupied;
    }

    if (!this.isOccupied) {
      // Natural rolling stop when vacant
      if (Math.abs(this.speed) > 0.05) {
        this.speed -= Math.sign(this.speed) * this.friction * dt;
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        let nextX = this.position.x + forward.x * this.speed * dt;
        let nextZ = this.position.z + forward.z * this.speed * dt;
        if (cityWorld && cityWorld.resolveCollision) {
          const res = cityWorld.resolveCollision(nextX, nextZ, this.radius);
          nextX = res.x;
          nextZ = res.z;
        }
        if (isFinite(nextX) && isFinite(nextZ)) {
          this.position.x = nextX;
          this.position.z = nextZ;
        }
      } else {
        this.speed = 0;
      }
      this.updateExhaustPuffs(dt);
      this.updateTireSmokes(dt);
      this.updateSkidMarks(dt);
      this.updateSparks(dt);
      return;
    }

    // 1. Responsive Steering with speed-adaptive lock
    const absSpeed = Math.abs(this.speed);
    const speedRatio = absSpeed / this.maxSpeed;
    const steerLimit = THREE.MathUtils.lerp(this.maxSteerAngle, 0.44, speedRatio);
    const targetSteer = -inputSteer * steerLimit;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * this.steerSpeed);

    this.frontSteerPivots.forEach(pivot => {
      pivot.rotation.y = this.steerAngle;
    });

    // 2. Throttle, Gears & Braking Dynamics
    const isBraking = (this.speed > 0.5 && inputAccel < 0) || isHandbrake;
    const isReversing = (this.speed < -0.1);

    // Dynamic Taillights (glow intense red on brake, white on reverse)
    if (this.tailLightMat) {
      if (isBraking) {
        this.tailLightMat.color.setHex(0xff0000);
        this.tailLightMat.emissive.setHex(0xdd0000);
      } else {
        this.tailLightMat.color.setHex(0x550000);
        this.tailLightMat.emissive.setHex(0x220000);
      }
    }
    if (this.revLightMat) {
      this.revLightMat.emissive.setHex(isReversing ? 0xffffff : 0x000000);
    }

    // 4-Speed Gear Simulation for realistic engine RPM pitch
    if (absSpeed < 9.0) {
      this.gear = 1;
      this.rpm = THREE.MathUtils.lerp(0.25, 0.95, absSpeed / 9.0);
    } else if (absSpeed < 19.0) {
      this.gear = 2;
      this.rpm = THREE.MathUtils.lerp(0.38, 0.95, (absSpeed - 9.0) / 10.0);
    } else if (absSpeed < 29.0) {
      this.gear = 3;
      this.rpm = THREE.MathUtils.lerp(0.48, 0.98, (absSpeed - 19.0) / 10.0);
    } else {
      this.gear = 4;
      this.rpm = THREE.MathUtils.lerp(0.58, 1.05, (absSpeed - 29.0) / 9.0);
    }

    if (inputAccel > 0) {
      // Throttle acceleration by gear
      const gearTorque = [1.38, 1.15, 0.95, 0.8][this.gear - 1];
      this.speed += this.acceleration * gearTorque * dt;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (inputAccel < 0) {
      if (this.speed > 0.5) {
        this.speed -= this.braking * dt;
      } else {
        this.speed -= this.acceleration * 0.85 * dt;
        if (this.speed < this.reverseSpeed) this.speed = this.reverseSpeed;
      }
    } else {
      if (absSpeed > 0.1) {
        this.speed -= Math.sign(this.speed) * this.friction * dt;
      } else {
        this.speed = 0;
      }
    }

    // 3. Handbrake & Drift Mechanics
    let isDrifting = false;
    if (isHandbrake) {
      this.speed -= Math.sign(this.speed) * this.braking * 0.75 * dt;
      if (absSpeed > 3.0) {
        isDrifting = true;
        this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 1.0, dt * 8);
      }
    } else {
      if (Math.abs(this.steerAngle) > 0.32 && absSpeed > 15.0) {
        isDrifting = true;
        this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 0.65, dt * 5);
      } else {
        this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 0, dt * 6);
      }
    }

    // 4. Turning with authentic weight & drift angle
    if (absSpeed > 0.15) {
      const driftMultiplier = 1.0 + this.driftFactor * 1.35;
      const turnRate = (this.speed / this.maxSpeed) * this.steerAngle * 3.2 * driftMultiplier;
      this.rotation.y += turnRate * dt;

      // Realistic suspension roll & pitch
      this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(
        this.carBodyGroup.rotation.z,
        -this.steerAngle * (absSpeed / this.maxSpeed) * 0.22,
        dt * 8
      );
      const pitchTarget = (inputAccel > 0 ? -0.05 : (isBraking ? 0.07 : 0));
      this.carBodyGroup.rotation.x = THREE.MathUtils.lerp(this.carBodyGroup.rotation.x, pitchTarget, dt * 7);
    } else {
      this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(this.carBodyGroup.rotation.z, 0, dt * 6);
      this.carBodyGroup.rotation.x = THREE.MathUtils.lerp(this.carBodyGroup.rotation.x, 0, dt * 6);
    }

    // 5. Tire Squeal, Skid Marks & Smoke
    if (isDrifting && absSpeed > 4.0) {
      window.soundEngine.setTireSqueal(Math.min(0.4, this.driftFactor * 0.45));
      this.emitTireSmoke();
      this.emitSkidMark();
    } else {
      window.soundEngine.setTireSqueal(0);
    }

    // 6. Displacement & Wall Sliding Collisions with Sparks
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    let nextX = this.position.x + forward.x * this.speed * dt;
    let nextZ = this.position.z + forward.z * this.speed * dt;

    if (cityWorld && cityWorld.resolveCollision) {
      const res = cityWorld.resolveCollision(nextX, nextZ, this.radius);
      if (res.collided) {
        if (absSpeed > 3.0) {
          window.soundEngine.playWallScrape();
          this.emitSparks(res.x, res.z);
          this.speed = -this.speed * 0.35;
        }
      }
      nextX = res.x;
      nextZ = res.z;
    }

    if (isFinite(nextX) && isFinite(nextZ)) {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // 7. Rotate wheels with tire speed
    const wheelRotSpeed = (this.speed / 0.4) * dt;
    this.wheels.forEach(w => {
      w.rotation.x += wheelRotSpeed;
    });

    // 8. Update Engine Audio with RPM
    window.soundEngine.updateCarEngine(speedRatio, this.rpm);

    // Exhaust smoke puffs on throttle
    if (inputAccel > 0 && Math.random() > 0.35) {
      this.emitExhaustPuff();
    }

    this.updateExhaustPuffs(dt);
    this.updateTireSmokes(dt);
    this.updateSkidMarks(dt);
    this.updateSparks(dt);
  }

  emitSkidMark() {
    if (!this.skidMarkMat) {
      this.skidMarkMat = new THREE.MeshBasicMaterial({
        color: 0x0a0c10,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      this.skidMarkGeo = new THREE.PlaneGeometry(0.24, 0.85);
    }

    const offsets = [-0.85, 0.85];
    offsets.forEach(ox => {
      const mark = new THREE.Mesh(this.skidMarkGeo, this.skidMarkMat);
      mark.rotation.x = -Math.PI / 2;
      mark.rotation.z = -this.rotation.y;

      const pos = new THREE.Vector3(ox, 0.018, -1.65).applyEuler(this.rotation).add(this.position);
      mark.position.copy(pos);
      this.scene.add(mark);
      this.skidMarks.push({ mesh: mark, life: 0, maxLife: 10.0 });
    });

    // Ring buffer max 80 marks
    if (this.skidMarks.length > 80) {
      const old = this.skidMarks.shift();
      this.scene.remove(old.mesh);
    }
  }

  updateSkidMarks(dt) {
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        this.skidMarks.splice(i, 1);
      }
    }
  }

  emitSparks(cx, cz) {
    const sparkGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(cx + (Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.6, cz + (Math.random() - 0.5) * 0.4);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6.0,
        Math.random() * 4.0 + 1.0,
        (Math.random() - 0.5) * 6.0
      );
      this.scene.add(spark);
      this.sparks.push({ mesh: spark, vel: vel, life: 0, maxLife: 0.35 });
    }
  }

  updateSparks(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.vel && s.mesh) {
        s.mesh.position.addScaledVector(s.vel, dt);
        s.vel.y -= 14.0 * dt; // gravity
      }
      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        this.sparks.splice(i, 1);
      }
    }
  }

  emitTireSmoke() {
    if (Math.random() > 0.45) return;
    const smokeGeo = new THREE.SphereGeometry(0.18 + Math.random() * 0.08, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.45, depthWrite: false });
    const sideX = Math.random() > 0.5 ? 0.85 : -0.85;
    const puff = new THREE.Mesh(smokeGeo, smokeMat);
    const pos = new THREE.Vector3(sideX, 0.25, -1.65).applyEuler(this.rotation).add(this.position);
    puff.position.copy(pos);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      Math.random() * 0.6 + 0.3,
      (Math.random() - 0.5) * 0.8
    );
    this.scene.add(puff);
    this.tireSmokes.push({ mesh: puff, mat: smokeMat, velocity: vel, life: 0, maxLife: 0.65 });
  }

  updateTireSmokes(dt) {
    for (let i = this.tireSmokes.length - 1; i >= 0; i--) {
      const p = this.tireSmokes[i];
      p.life += dt;
      if (p.velocity && p.mesh && p.mesh.position) {
        p.mesh.position.addScaledVector(p.velocity, dt);
      }
      if (p.mesh && p.mesh.scale) {
        p.mesh.scale.multiplyScalar(1.08);
      }
      if (p.mat) {
        p.mat.opacity = Math.max(0, (1 - p.life / p.maxLife) * 0.45);
      }
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        this.tireSmokes.splice(i, 1);
      }
    }
  }

  emitExhaustPuff() {
    const puffGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.05, 6, 6);
    const puffMat = new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.55 });
    const puff = new THREE.Mesh(puffGeo, puffMat);

    const offset = new THREE.Vector3((Math.random() > 0.5 ? 0.48 : -0.48), 0.26, -2.85);
    offset.applyEuler(this.rotation).add(this.position);
    puff.position.copy(offset);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.9 + 0.3,
      (Math.random() - 0.5) * 0.5
    );

    this.scene.add(puff);
    this.exhaustPuffs.push({ mesh: puff, mat: puffMat, velocity: vel, life: 0, maxLife: 0.55 });
  }

  updateExhaustPuffs(dt) {
    for (let i = this.exhaustPuffs.length - 1; i >= 0; i--) {
      const p = this.exhaustPuffs[i];
      p.life += dt;
      if (p.velocity && p.mesh && p.mesh.position) {
        p.mesh.position.addScaledVector(p.velocity, dt);
      }
      if (p.mesh && p.mesh.scale) {
        p.mesh.scale.multiplyScalar(1.06);
      }
      if (p.mat) {
        p.mat.opacity = Math.max(0, (1 - p.life / p.maxLife) * 0.55);
      }

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
    this.volumetricBeams.forEach(b => b.visible = this.headlightsOn);
  }

  enterCar() {
    this.isOccupied = true;
    this.promptSprite.visible = false;
    window.soundEngine.playCarDoor();
    window.soundEngine.startCarEngine();
  }

  exitCar() {
    this.isOccupied = false;
    this.speed = 0;
    window.soundEngine.playCarDoor();
    window.soundEngine.stopCarEngine();
  }
}

window.MafiaCar = MafiaCar;

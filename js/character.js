/**
 * Michelle De Santa 3D - Character Model & Rig (GTA 3 Style)
 * Accurately models Michelle with robust crash-proof physics.
 */

class MichelleCharacter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.position = this.group.position;
    this.rotation = this.group.rotation;

    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.speed = 0;
    this.walkSpeed = 6.0;
    this.sprintSpeed = 11.0;
    this.jumpForce = 8.0;
    this.gravity = 22.0;
    this.radius = 0.45;

    this.state = 'idle';
    this.animTime = 0;
    this.actionTimer = 0;

    this.initTextures();
    this.buildModel();
    this.createSpeechBubble();
  }

  initTextures() {
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 256;
    suitCanvas.height = 256;
    const sctx = suitCanvas.getContext('2d');
    sctx.fillStyle = '#16191f';
    sctx.fillRect(0, 0, 256, 256);

    sctx.strokeStyle = 'rgba(180, 195, 215, 0.45)';
    sctx.lineWidth = 2.0;
    for (let x = 8; x < 256; x += 16) {
      sctx.beginPath();
      sctx.moveTo(x, 0);
      sctx.lineTo(x, 256);
      sctx.stroke();
    }
    this.suitTexture = new THREE.CanvasTexture(suitCanvas);
    this.suitTexture.wrapS = THREE.RepeatWrapping;
    this.suitTexture.wrapT = THREE.RepeatWrapping;
    this.suitTexture.repeat.set(2, 2);

    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x3d2805
    });

    this.suitMaterial = new THREE.MeshStandardMaterial({
      map: this.suitTexture,
      roughness: 0.65,
      metalness: 0.15
    });

    this.fedoraMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5e66, roughness: 0.75 });
    this.ribbonMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.3 });
    this.skinMaterial = new THREE.MeshStandardMaterial({ color: 0xdfb090, roughness: 0.55 });
    this.hairMaterial = new THREE.MeshStandardMaterial({ color: 0x1d1714, roughness: 0.9 });
    this.shirtMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.5 });
    this.tieMaterial = new THREE.MeshStandardMaterial({ color: 0x221313, roughness: 0.3 });
    this.shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.15, metalness: 0.6 });
  }

  buildModel() {
    this.bones = {};

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    this.group.add(pelvis);
    this.bones.pelvis = pelvis;

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.3), this.suitMaterial);
    torsoMesh.position.y = 0.31;
    torsoMesh.castShadow = true;
    pelvis.add(torsoMesh);
    this.bones.torso = torsoMesh;

    const shirtMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.05), this.shirtMaterial);
    shirtMesh.position.set(0, 0.46, 0.14);
    pelvis.add(shirtMesh);

    const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.04), this.tieMaterial);
    tieMesh.position.set(0, 0.33, 0.16);
    pelvis.add(tieMesh);

    const clipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95 }));
    clipMesh.position.set(0, 0.36, 0.18);
    pelvis.add(clipMesh);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.69, 0);
    pelvis.add(headGroup);
    this.bones.head = headGroup;

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), this.skinMaterial);
    headMesh.position.y = 0.12;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.3), this.hairMaterial);
    hairMesh.position.set(0, 0.2, -0.02);
    headGroup.add(hairMesh);

    const beardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.13, 0.23), this.hairMaterial);
    beardMesh.position.set(0, 0.04, 0.05);
    headGroup.add(beardMesh);

    const earringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 8, 16), this.goldMaterial);
    earringMesh.position.set(-0.15, 0.12, 0.0);
    earringMesh.rotation.y = Math.PI / 2;
    headGroup.add(earringMesh);

    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.28, 0.02);
    hatGroup.rotation.x = -0.07;
    headGroup.add(hatGroup);
    this.bones.hat = hatGroup;

    const brimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.02, 24), this.fedoraMaterial);
    brimMesh.castShadow = true;
    hatGroup.add(brimMesh);

    const crownMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.23, 22), this.fedoraMaterial);
    crownMesh.position.y = 0.115;
    crownMesh.castShadow = true;
    hatGroup.add(crownMesh);

    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.05, 22), this.ribbonMaterial);
    bandMesh.position.y = 0.035;
    hatGroup.add(bandMesh);

    // Arms
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.33, 0.53, 0);
    pelvis.add(leftShoulder);
    this.bones.leftShoulder = leftShoulder;

    const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.33, 0.14), this.suitMaterial);
    leftUpperArm.position.y = -0.165;
    leftUpperArm.castShadow = true;
    leftShoulder.add(leftUpperArm);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.33;
    leftShoulder.add(leftElbow);
    this.bones.leftElbow = leftElbow;

    const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.13), this.suitMaterial);
    leftForearm.position.y = -0.14;
    leftForearm.castShadow = true;
    leftElbow.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.08), this.skinMaterial);
    leftHand.position.y = -0.32;
    leftElbow.add(leftHand);

    // Big Gold Ring
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.016, 10, 20), this.goldMaterial);
    ringMesh.position.set(-0.02, -0.31, 0.02);
    ringMesh.rotation.x = Math.PI / 2;
    leftElbow.add(ringMesh);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.33, 0.53, 0);
    pelvis.add(rightShoulder);
    this.bones.rightShoulder = rightShoulder;

    const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.33, 0.14), this.suitMaterial);
    rightUpperArm.position.y = -0.165;
    rightUpperArm.castShadow = true;
    rightShoulder.add(rightUpperArm);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.33;
    rightShoulder.add(rightElbow);
    this.bones.rightElbow = rightElbow;

    const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.13), this.suitMaterial);
    rightForearm.position.y = -0.14;
    rightForearm.castShadow = true;
    rightElbow.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.08), this.skinMaterial);
    rightHand.position.y = -0.32;
    rightElbow.add(rightHand);

    // Legs
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.16, 0, 0);
    pelvis.add(leftHip);
    this.bones.leftHip = leftHip;

    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.46, 0.17), this.suitMaterial);
    leftThigh.position.y = -0.23;
    leftThigh.castShadow = true;
    leftHip.add(leftThigh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.46;
    leftHip.add(leftKnee);
    this.bones.leftKnee = leftKnee;

    const leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.43, 0.15), this.suitMaterial);
    leftShin.position.y = -0.215;
    leftShin.castShadow = true;
    leftKnee.add(leftShin);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), this.shoeMaterial);
    leftShoe.position.set(0, -0.45, 0.05);
    leftKnee.add(leftShoe);

    const rightHip = new THREE.Group();
    rightHip.position.set(0.16, 0, 0);
    pelvis.add(rightHip);
    this.bones.rightHip = rightHip;

    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.46, 0.17), this.suitMaterial);
    rightThigh.position.y = -0.23;
    rightThigh.castShadow = true;
    rightHip.add(rightThigh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.46;
    rightHip.add(rightKnee);
    this.bones.rightKnee = rightKnee;

    const rightShin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.43, 0.15), this.suitMaterial);
    rightShin.position.y = -0.215;
    rightShin.castShadow = true;
    rightKnee.add(rightShin);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), this.shoeMaterial);
    rightShoe.position.set(0, -0.45, 0.05);
    rightKnee.add(rightShoe);

    // Shadow
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
    this.shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), shadowMat);
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.02;
    this.scene.add(this.shadowDisc);
  }

  createSpeechBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 17, 22, 0.88)';
    ctx.roundRect ? ctx.roundRect(10, 10, 236, 44, 12) : ctx.rect(10, 10, 236, 44);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('MICHELLE DE SANTA', 128, 38);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
    sprite.scale.set(1.6, 0.4, 1);
    sprite.position.set(0, 2.2, 0);
    this.group.add(sprite);
    this.titleSprite = sprite;
  }

  update(dt, inputDir, isSprint, isJumpPressed, cityWorld) {
    this.animTime += dt;

    if (this.state === 'driving') {
      if (this.shadowDisc) this.shadowDisc.visible = false;
      if (this.titleSprite) this.titleSprite.visible = false;
      return;
    }

    if (this.shadowDisc) {
      this.shadowDisc.visible = true;
      this.shadowDisc.position.set(this.position.x, 0.02, this.position.z);
    }
    if (this.titleSprite) this.titleSprite.visible = true;

    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'idle';
      }
    }

    const moveLen = inputDir.length();
    const currentSpeed = isSprint ? this.sprintSpeed : this.walkSpeed;

    if (this.state !== 'punch' && this.state !== 'throw' && this.state !== 'calm_pose') {
      if (moveLen > 0.05) {
        this.speed = currentSpeed;

        const targetRot = Math.atan2(inputDir.x, inputDir.z);
        let diff = targetRot - this.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotation.y += diff * Math.min(1, dt * 14);

        let nextX = this.position.x + inputDir.x * this.speed * dt;
        let nextZ = this.position.z + inputDir.z * this.speed * dt;

        if (cityWorld && cityWorld.resolveCollision) {
          const res = cityWorld.resolveCollision(nextX, nextZ, this.radius);
          nextX = res.x;
          nextZ = res.z;
        }

        if (isFinite(nextX) && isFinite(nextZ)) {
          this.position.x = nextX;
          this.position.z = nextZ;
        }

        if (this.isGrounded) {
          this.state = isSprint ? 'run' : 'walk';
          if (Math.sin(this.animTime * (isSprint ? 14 : 9)) > 0.95) {
            if (!this.lastFootstep || (this.animTime - this.lastFootstep > 0.25)) {
              window.soundEngine.playFootstep();
              this.lastFootstep = this.animTime;
            }
          }
        }
      } else {
        this.speed = 0;
        if (this.isGrounded) {
          this.state = 'idle';
        }
      }

      if (isJumpPressed && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.state = 'jump';
        window.soundEngine.playJump();
      }
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.animate(dt);
  }

  animate(dt) {
    const b = this.bones;
    const t = this.animTime;

    if (this.state === 'idle') {
      b.torso.position.y = 0.31 + Math.sin(t * 2) * 0.015;
      b.head.rotation.y = Math.sin(t * 0.8) * 0.1;
      b.head.rotation.x = Math.sin(t * 1.2) * 0.03;

      b.leftShoulder.rotation.x = 0.05 + Math.sin(t * 1.5) * 0.02;
      b.leftElbow.rotation.x = -0.2;
      b.rightShoulder.rotation.x = 0.05 - Math.sin(t * 1.5) * 0.02;
      b.rightElbow.rotation.x = -0.2;

      b.leftHip.rotation.x = 0;
      b.rightHip.rotation.x = 0;
      b.leftKnee.rotation.x = 0;
      b.rightKnee.rotation.x = 0;
    }
    else if (this.state === 'walk') {
      const freq = 8;
      const swing = Math.sin(t * freq);

      b.leftShoulder.rotation.x = swing * 0.55;
      b.rightShoulder.rotation.x = -swing * 0.55;
      b.leftElbow.rotation.x = -0.3 + Math.abs(swing) * 0.2;
      b.rightElbow.rotation.x = -0.3 + Math.abs(swing) * 0.2;

      b.leftHip.rotation.x = -swing * 0.65;
      b.rightHip.rotation.x = swing * 0.65;
      b.leftKnee.rotation.x = swing > 0 ? swing * 0.65 : 0;
      b.rightKnee.rotation.x = swing < 0 ? -swing * 0.65 : 0;

      b.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * freq)) * 0.04;
      b.torso.rotation.y = swing * 0.08;
    }
    else if (this.state === 'run') {
      const freq = 14;
      const swing = Math.sin(t * freq);

      b.torso.rotation.x = 0.22;
      b.leftShoulder.rotation.x = swing * 0.95;
      b.rightShoulder.rotation.x = -swing * 0.95;
      b.leftElbow.rotation.x = -0.6;
      b.rightElbow.rotation.x = -0.6;

      b.leftHip.rotation.x = -swing * 0.95;
      b.rightHip.rotation.x = swing * 0.95;
      b.leftKnee.rotation.x = swing > 0 ? swing * 0.95 : 0.1;
      b.rightKnee.rotation.x = swing < 0 ? -swing * 0.95 : 0.1;

      b.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * freq)) * 0.08;
    }
    else if (this.state === 'jump') {
      b.torso.rotation.x = 0.1;
      b.leftShoulder.rotation.x = -0.8;
      b.rightShoulder.rotation.x = -0.8;
      b.leftHip.rotation.x = -0.5;
      b.rightHip.rotation.x = -0.3;
      b.leftKnee.rotation.x = 0.8;
      b.rightKnee.rotation.x = 0.7;
    }
    else if (this.state === 'punch') {
      b.rightShoulder.rotation.x = -1.45;
      b.rightElbow.rotation.x = 0;
      b.torso.rotation.y = -0.4;
      b.leftShoulder.rotation.x = 0.3;
      b.leftElbow.rotation.x = -0.8;
    }
    else if (this.state === 'throw') {
      b.leftShoulder.rotation.x = -1.35;
      b.leftElbow.rotation.x = -0.2;
      b.torso.rotation.y = 0.3;
    }
    else if (this.state === 'calm_pose') {
      b.rightShoulder.rotation.x = -1.6;
      b.rightElbow.rotation.x = -1.4;
      b.head.rotation.x = 0.1;
      b.head.rotation.y = 0.05;
      b.leftShoulder.rotation.x = 0.2;
      b.leftElbow.rotation.x = -0.4;
    }
  }

  punch() {
    if (this.state === 'driving') return;
    this.state = 'punch';
    this.actionTimer = 0.35;
    window.soundEngine.playPunch();
  }

  throwCash() {
    if (this.state === 'driving') return;
    this.state = 'throw';
    this.actionTimer = 0.45;
    window.soundEngine.playCashThrow();
  }

  calmPose() {
    this.state = 'calm_pose';
    this.actionTimer = 1.2;
    window.soundEngine.playCalmFocus();
  }
}

window.MichelleCharacter = MichelleCharacter;

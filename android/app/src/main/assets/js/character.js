/**
 * Michelle De Santa 3D - Character Model & Rig
 * Accurately models Michelle from the presentation with enhanced graphics
 * and precise building collision resolution.
 */

class MichelleCharacter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.position = this.group.position;
    this.rotation = this.group.rotation;

    // Movement / physics states
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.speed = 0;
    this.walkSpeed = 6.0;
    this.sprintSpeed = 11.0;
    this.jumpForce = 8.0;
    this.gravity = 22.0;
    this.radius = 0.45;

    // States: 'idle', 'walk', 'run', 'jump', 'punch', 'throw', 'calm_pose', 'driving'
    this.state = 'idle';
    this.animTime = 0;
    this.actionTimer = 0;

    // Build the 3D Model
    this.initTextures();
    this.buildModel();

    // Floating name / badge above head
    this.createSpeechBubble();
  }

  initTextures() {
    // 1. High-Res Pinstripe Suit Texture
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 256;
    suitCanvas.height = 256;
    const sctx = suitCanvas.getContext('2d');
    sctx.fillStyle = '#16191f'; // Deep charcoal noir suit
    sctx.fillRect(0, 0, 256, 256);

    // Fine wool grain
    for (let i = 0; i < 2000; i++) {
      sctx.fillStyle = (Math.random() > 0.5) ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)';
      sctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    // Elegant silver pinstripes
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

    // 2. Ultra-Shiny Gold Signet Ring Material
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x3d2805
    });

    // 3. Suit Material
    this.suitMaterial = new THREE.MeshStandardMaterial({
      map: this.suitTexture,
      roughness: 0.65,
      metalness: 0.15
    });

    // 4. Fedora Grey Material (High-grade felt)
    this.fedoraMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5e66,
      roughness: 0.75,
      metalness: 0.05
    });

    // 5. Fedora Black Silk Ribbon
    this.ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.3,
      metalness: 0.2
    });

    // 6. Skin Tone Material
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb090,
      roughness: 0.55
    });

    // 7. Hair / Beard Material
    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d1714,
      roughness: 0.9
    });

    // 8. White Shirt Material
    this.shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f6f8,
      roughness: 0.5
    });

    // 9. Dark Tie Material
    this.tieMaterial = new THREE.MeshStandardMaterial({
      color: 0x221313,
      roughness: 0.3
    });

    // 10. Polished Black Shoes Material
    this.shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0x08080a,
      roughness: 0.15,
      metalness: 0.6
    });
  }

  buildModel() {
    this.bones = {};

    // Root pelvis
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    this.group.add(pelvis);
    this.bones.pelvis = pelvis;

    // Torso / Suit Jacket
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.62, 0.3);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.suitMaterial);
    torsoMesh.position.y = 0.31;
    torsoMesh.castShadow = true;
    pelvis.add(torsoMesh);
    this.bones.torso = torsoMesh;

    // White shirt collar visible in V-neck
    const shirtGeo = new THREE.BoxGeometry(0.2, 0.26, 0.05);
    const shirtMesh = new THREE.Mesh(shirtGeo, this.shirtMaterial);
    shirtMesh.position.set(0, 0.46, 0.14);
    pelvis.add(shirtMesh);

    // Dark Tie
    const tieGeo = new THREE.BoxGeometry(0.08, 0.36, 0.04);
    const tieMesh = new THREE.Mesh(tieGeo, this.tieMaterial);
    tieMesh.position.set(0, 0.33, 0.16);
    pelvis.add(tieMesh);

    // Silver Tie Clip
    const clipGeo = new THREE.BoxGeometry(0.09, 0.02, 0.02);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95 });
    const clipMesh = new THREE.Mesh(clipGeo, clipMat);
    clipMesh.position.set(0, 0.36, 0.18);
    pelvis.add(clipMesh);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.69, 0);
    pelvis.add(headGroup);
    this.bones.head = headGroup;

    // Head base
    const headGeo = new THREE.BoxGeometry(0.28, 0.32, 0.28);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.position.y = 0.12;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Short dark hair
    const hairGeo = new THREE.BoxGeometry(0.3, 0.18, 0.3);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMaterial);
    hairMesh.position.set(0, 0.2, -0.02);
    headGroup.add(hairMesh);

    // Trimmed Beard around jaw
    const beardGeo = new THREE.BoxGeometry(0.29, 0.13, 0.23);
    const beardMesh = new THREE.Mesh(beardGeo, this.hairMaterial);
    beardMesh.position.set(0, 0.04, 0.05);
    headGroup.add(beardMesh);

    // Left Earring (Gold hoop on left ear)
    const earringGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16);
    const earringMesh = new THREE.Mesh(earringGeo, this.goldMaterial);
    earringMesh.position.set(-0.15, 0.12, 0.0);
    earringMesh.rotation.y = Math.PI / 2;
    headGroup.add(earringMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x181818 });
    const eyeGeo = new THREE.BoxGeometry(0.04, 0.02, 0.02);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.07, 0.15, 0.145);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.07, 0.15, 0.145);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // ---- THE SIGNATURE GREY FEDORA HAT ----
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.28, 0.02);
    hatGroup.rotation.x = -0.07;
    headGroup.add(hatGroup);
    this.bones.hat = hatGroup;

    // Brim (wide, stylishly curved)
    const brimGeo = new THREE.CylinderGeometry(0.33, 0.35, 0.02, 24);
    const brimMesh = new THREE.Mesh(brimGeo, this.fedoraMaterial);
    brimMesh.castShadow = true;
    hatGroup.add(brimMesh);

    // Crown
    const crownGeo = new THREE.CylinderGeometry(0.21, 0.25, 0.23, 22);
    const crownMesh = new THREE.Mesh(crownGeo, this.fedoraMaterial);
    crownMesh.position.y = 0.115;
    crownMesh.castShadow = true;
    hatGroup.add(crownMesh);

    // Crown crease
    const creaseGeo = new THREE.BoxGeometry(0.13, 0.05, 0.27);
    const creaseMesh = new THREE.Mesh(creaseGeo, this.fedoraMaterial);
    creaseMesh.position.set(0, 0.23, 0);
    hatGroup.add(creaseMesh);

    // Black Silk Ribbon
    const bandGeo = new THREE.CylinderGeometry(0.255, 0.255, 0.05, 22);
    const bandMesh = new THREE.Mesh(bandGeo, this.ribbonMaterial);
    bandMesh.position.y = 0.035;
    hatGroup.add(bandMesh);

    // ---- ARMS & HANDS ----

    // Left Arm (with the BIG GOLD RING)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.33, 0.53, 0);
    pelvis.add(leftShoulder);
    this.bones.leftShoulder = leftShoulder;

    const armGeo = new THREE.BoxGeometry(0.14, 0.33, 0.14);
    const leftUpperArm = new THREE.Mesh(armGeo, this.suitMaterial);
    leftUpperArm.position.y = -0.165;
    leftUpperArm.castShadow = true;
    leftShoulder.add(leftUpperArm);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.33;
    leftShoulder.add(leftElbow);
    this.bones.leftElbow = leftElbow;

    const forearmGeo = new THREE.BoxGeometry(0.13, 0.28, 0.13);
    const leftForearm = new THREE.Mesh(forearmGeo, this.suitMaterial);
    leftForearm.position.y = -0.14;
    leftForearm.castShadow = true;
    leftElbow.add(leftForearm);

    // Left Hand
    const handGeo = new THREE.BoxGeometry(0.1, 0.11, 0.08);
    const leftHand = new THREE.Mesh(handGeo, this.skinMaterial);
    leftHand.position.y = -0.32;
    leftElbow.add(leftHand);

    // ---- BIG GOLD SIGNET RING ----
    const ringGeo = new THREE.TorusGeometry(0.038, 0.016, 10, 20);
    const ringMesh = new THREE.Mesh(ringGeo, this.goldMaterial);
    ringMesh.position.set(-0.02, -0.31, 0.02);
    ringMesh.rotation.x = Math.PI / 2;
    leftElbow.add(ringMesh);

    // Diamond / Signet Crest
    const gemGeo = new THREE.BoxGeometry(0.045, 0.022, 0.045);
    const gemMesh = new THREE.Mesh(gemGeo, this.goldMaterial);
    gemMesh.position.set(-0.02, -0.30, 0.048);
    leftElbow.add(gemMesh);

    // Right Arm
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.33, 0.53, 0);
    pelvis.add(rightShoulder);
    this.bones.rightShoulder = rightShoulder;

    const rightUpperArm = new THREE.Mesh(armGeo, this.suitMaterial);
    rightUpperArm.position.y = -0.165;
    rightUpperArm.castShadow = true;
    rightShoulder.add(rightUpperArm);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.33;
    rightShoulder.add(rightElbow);
    this.bones.rightElbow = rightElbow;

    const rightForearm = new THREE.Mesh(forearmGeo, this.suitMaterial);
    rightForearm.position.y = -0.14;
    rightForearm.castShadow = true;
    rightElbow.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo, this.skinMaterial);
    rightHand.position.y = -0.32;
    rightElbow.add(rightHand);
    this.bones.rightHand = rightHand;

    // ---- LEGS & SHOES ----

    // Left Leg
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.16, 0, 0);
    pelvis.add(leftHip);
    this.bones.leftHip = leftHip;

    const legGeo = new THREE.BoxGeometry(0.17, 0.46, 0.17);
    const leftThigh = new THREE.Mesh(legGeo, this.suitMaterial);
    leftThigh.position.y = -0.23;
    leftThigh.castShadow = true;
    leftHip.add(leftThigh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.46;
    leftHip.add(leftKnee);
    this.bones.leftKnee = leftKnee;

    const shinGeo = new THREE.BoxGeometry(0.15, 0.43, 0.15);
    const leftShin = new THREE.Mesh(shinGeo, this.suitMaterial);
    leftShin.position.y = -0.215;
    leftShin.castShadow = true;
    leftKnee.add(leftShin);

    const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.28);
    const leftShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    leftShoe.position.set(0, -0.45, 0.05);
    leftKnee.add(leftShoe);

    // Right Leg
    const rightHip = new THREE.Group();
    rightHip.position.set(0.16, 0, 0);
    pelvis.add(rightHip);
    this.bones.rightHip = rightHip;

    const rightThigh = new THREE.Mesh(legGeo, this.suitMaterial);
    rightThigh.position.y = -0.23;
    rightThigh.castShadow = true;
    rightHip.add(rightThigh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.46;
    rightHip.add(rightKnee);
    this.bones.rightKnee = rightKnee;

    const rightShin = new THREE.Mesh(shinGeo, this.suitMaterial);
    rightShin.position.y = -0.215;
    rightShin.castShadow = true;
    rightKnee.add(rightShin);

    const rightShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    rightShoe.position.set(0, -0.45, 0.05);
    rightKnee.add(rightShoe);

    // Ground shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.48, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45
    });
    this.shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
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

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.titleSprite = new THREE.Sprite(mat);
    this.titleSprite.scale.set(1.6, 0.4, 1);
    this.titleSprite.position.set(0, 2.2, 0);
    this.group.add(this.titleSprite);
  }

  update(dt, inputDir, isSprint, isJumpPressed, cityWorld) {
    this.animTime += dt;

    if (this.state === 'driving') {
      this.shadowDisc.visible = false;
      this.titleSprite.visible = false;
      return;
    }

    this.shadowDisc.visible = true;
    this.titleSprite.visible = true;
    this.shadowDisc.position.set(this.position.x, 0.02, this.position.z);

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

        // Smooth rotation towards travel direction
        const targetRot = Math.atan2(inputDir.x, inputDir.z);
        let diff = targetRot - this.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotation.y += diff * Math.min(1, dt * 14);

        // Move position
        const deltaX = inputDir.x * this.speed * dt;
        const deltaZ = inputDir.z * this.speed * dt;

        let nextX = this.position.x + deltaX;
        let nextZ = this.position.z + deltaZ;

        // ---- COLLISION CHECK AGAINST BUILDINGS & OBSTACLES ----
        if (cityWorld && cityWorld.resolveCollision) {
          const res = cityWorld.resolveCollision(nextX, nextZ, this.radius);
          nextX = res.x;
          nextZ = res.z;
        }

        this.position.x = nextX;
        this.position.z = nextZ;

        if (this.isGrounded) {
          this.state = isSprint ? 'run' : 'walk';

          // Footstep audio
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

      // Jump
      if (isJumpPressed && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.state = 'jump';
        window.soundEngine.playJump();
      }
    }

    // Gravity
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
    this.createImpactSparks();
  }

  throwCash() {
    if (this.state === 'driving') return;
    this.state = 'throw';
    this.actionTimer = 0.45;
    window.soundEngine.playCashThrow();
    this.spawnFlyingCash();
  }

  calmPose() {
    this.state = 'calm_pose';
    this.actionTimer = 1.2;
    window.soundEngine.playCalmFocus();
  }

  createImpactSparks() {
    const sparkGeo = new THREE.BufferGeometry();
    const count = 16;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 0.45;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.08,
      transparent: true,
      opacity: 0.95
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);

    const fistPos = new THREE.Vector3(0.3, 1.4, 0.7).applyEuler(this.rotation).add(this.position);
    sparks.position.copy(fistPos);
    this.scene.add(sparks);

    let fade = 0;
    const interval = setInterval(() => {
      fade += 0.12;
      sparks.scale.multiplyScalar(1.15);
      sparkMat.opacity -= 0.16;
      if (fade >= 1.0) {
        clearInterval(interval);
        this.scene.remove(sparks);
        sparkGeo.dispose();
        sparkMat.dispose();
      }
    }, 30);
  }

  spawnFlyingCash() {
    const cashGroup = new THREE.Group();
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    const spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(forward, 0.4);
    cashGroup.position.copy(spawnPos);

    const billGeo = new THREE.PlaneGeometry(0.2, 0.1);
    const billMat = new THREE.MeshBasicMaterial({
      color: 0x44bb55,
      side: THREE.DoubleSide
    });

    const bills = [];
    for (let i = 0; i < 7; i++) {
      const bill = new THREE.Mesh(billGeo, billMat);
      bill.position.set(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      bill.velocity = forward.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.9 + 0.3, (Math.random() - 0.5) * 0.9))
        .multiplyScalar(3.8);
      bill.rotSpeed = new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9);
      cashGroup.add(bill);
      bills.push(bill);
    }
    this.scene.add(cashGroup);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.04;
      bills.forEach(b => {
        b.position.addScaledVector(b.velocity, 0.04);
        b.velocity.y -= 0.12;
        b.rotation.x += b.rotSpeed.x * 0.04;
        b.rotation.y += b.rotSpeed.y * 0.04;
      });
      if (life >= 0.85) {
        clearInterval(interval);
        this.scene.remove(cashGroup);
        billGeo.dispose();
        billMat.dispose();
      }
    }, 40);
  }
}

window.MichelleCharacter = MichelleCharacter;

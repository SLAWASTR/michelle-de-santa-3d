/**
 * Michelle De Santa 3D - Character Model & Rig
 * Accurately models Michelle from the presentation:
 * - Grey Fedora Hat with black silk ribbon
 * - Pinstripe dark mobster suit, white shirt, dark tie with silver clip
 * - Big Gold Ring on hand, Earring on ear, trimmed beard & short dark hair
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
    this.walkSpeed = 5.5;
    this.sprintSpeed = 10.0;
    this.jumpForce = 7.5;
    this.gravity = 20.0;

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
    // 1. Pinstripe Suit Texture
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 128;
    suitCanvas.height = 128;
    const sctx = suitCanvas.getContext('2d');
    sctx.fillStyle = '#1c1f24'; // Dark charcoal suit
    sctx.fillRect(0, 0, 128, 128);
    sctx.strokeStyle = 'rgba(160, 175, 190, 0.45)'; // Subtle fine pinstripe
    sctx.lineWidth = 1.5;
    for (let x = 8; x < 128; x += 16) {
      sctx.beginPath();
      sctx.moveTo(x, 0);
      sctx.lineTo(x, 128);
      sctx.stroke();
    }
    this.suitTexture = new THREE.CanvasTexture(suitCanvas);
    this.suitTexture.wrapS = THREE.RepeatWrapping;
    this.suitTexture.wrapT = THREE.RepeatWrapping;
    this.suitTexture.repeat.set(2, 2);

    // 2. Gold Ring / Metal material
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb140,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x332205
    });

    // 3. Suit Material
    this.suitMaterial = new THREE.MeshStandardMaterial({
      map: this.suitTexture,
      roughness: 0.7,
      metalness: 0.1
    });

    // 4. Fedora Grey Material
    this.fedoraMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5e65, // Classic grey felt
      roughness: 0.8,
      metalness: 0.05
    });

    // 5. Fedora Black Ribbon Material
    this.ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.4
    });

    // 6. Skin Tone Material
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5ba9b,
      roughness: 0.5
    });

    // 7. Hair / Beard Material
    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x221a15, // Dark brown/black
      roughness: 0.9
    });

    // 8. White Shirt Material
    this.shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.6
    });

    // 9. Dark Tie Material
    this.tieMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1818,
      roughness: 0.3
    });

    // 10. Polished Black Shoes Material
    this.shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.2,
      metalness: 0.5
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
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.28);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.suitMaterial);
    torsoMesh.position.y = 0.3;
    torsoMesh.castShadow = true;
    pelvis.add(torsoMesh);
    this.bones.torso = torsoMesh;

    // White shirt collar visible in V-neck
    const shirtGeo = new THREE.BoxGeometry(0.2, 0.25, 0.05);
    const shirtMesh = new THREE.Mesh(shirtGeo, this.shirtMaterial);
    shirtMesh.position.set(0, 0.45, 0.13);
    pelvis.add(shirtMesh);

    // Dark Tie
    const tieGeo = new THREE.BoxGeometry(0.08, 0.35, 0.04);
    const tieMesh = new THREE.Mesh(tieGeo, this.tieMaterial);
    tieMesh.position.set(0, 0.32, 0.15);
    pelvis.add(tieMesh);

    // Silver Tie Clip
    const clipGeo = new THREE.BoxGeometry(0.09, 0.02, 0.02);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
    const clipMesh = new THREE.Mesh(clipGeo, clipMat);
    clipMesh.position.set(0, 0.35, 0.17);
    pelvis.add(clipMesh);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.68, 0);
    pelvis.add(headGroup);
    this.bones.head = headGroup;

    // Head base
    const headGeo = new THREE.BoxGeometry(0.28, 0.32, 0.28);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.position.y = 0.12;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Short dark hair (sides & back)
    const hairGeo = new THREE.BoxGeometry(0.3, 0.18, 0.3);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMaterial);
    hairMesh.position.set(0, 0.2, -0.02);
    headGroup.add(hairMesh);

    // Trimmed Beard around jaw
    const beardGeo = new THREE.BoxGeometry(0.29, 0.12, 0.22);
    const beardMesh = new THREE.Mesh(beardGeo, this.hairMaterial);
    beardMesh.position.set(0, 0.04, 0.05);
    headGroup.add(beardMesh);

    // Left Earring (Gold hoop/stud on left ear as described)
    const earringGeo = new THREE.TorusGeometry(0.022, 0.006, 6, 12);
    const earringMesh = new THREE.Mesh(earringGeo, this.goldMaterial);
    earringMesh.position.set(-0.15, 0.12, 0.0);
    earringMesh.rotation.y = Math.PI / 2;
    headGroup.add(earringMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1f1f1f });
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
    hatGroup.rotation.x = -0.08; // Cool slight mobster tilt
    headGroup.add(hatGroup);
    this.bones.hat = hatGroup;

    // Brim (wide, stylishly curved)
    const brimGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.02, 24);
    const brimMesh = new THREE.Mesh(brimGeo, this.fedoraMaterial);
    brimMesh.castShadow = true;
    hatGroup.add(brimMesh);

    // Crown (creased top)
    const crownGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.22, 20);
    const crownMesh = new THREE.Mesh(crownGeo, this.fedoraMaterial);
    crownMesh.position.y = 0.11;
    crownMesh.castShadow = true;
    hatGroup.add(crownMesh);

    // Crown pinch (crease top)
    const creaseGeo = new THREE.BoxGeometry(0.12, 0.05, 0.26);
    const creaseMesh = new THREE.Mesh(creaseGeo, this.fedoraMaterial);
    creaseMesh.position.set(0, 0.22, 0);
    hatGroup.add(creaseMesh);

    // Black Silk Ribbon Band around hat crown
    const bandGeo = new THREE.CylinderGeometry(0.245, 0.245, 0.05, 20);
    const bandMesh = new THREE.Mesh(bandGeo, this.ribbonMaterial);
    bandMesh.position.y = 0.035;
    hatGroup.add(bandMesh);

    // ---- ARMS & HANDS ----

    // Left Arm (with the famous BIG GOLD RING)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.32, 0.52, 0);
    pelvis.add(leftShoulder);
    this.bones.leftShoulder = leftShoulder;

    const armGeo = new THREE.BoxGeometry(0.13, 0.32, 0.13);
    const leftUpperArm = new THREE.Mesh(armGeo, this.suitMaterial);
    leftUpperArm.position.y = -0.16;
    leftUpperArm.castShadow = true;
    leftShoulder.add(leftUpperArm);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.32;
    leftShoulder.add(leftElbow);
    this.bones.leftElbow = leftElbow;

    const forearmGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);
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
    const ringGeo = new THREE.TorusGeometry(0.035, 0.015, 8, 16);
    const ringMesh = new THREE.Mesh(ringGeo, this.goldMaterial);
    ringMesh.position.set(-0.02, -0.31, 0.02);
    ringMesh.rotation.x = Math.PI / 2;
    leftElbow.add(ringMesh);

    // Ring Gem / Signet crest on top
    const gemGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
    const gemMesh = new THREE.Mesh(gemGeo, this.goldMaterial);
    gemMesh.position.set(-0.02, -0.30, 0.045);
    leftElbow.add(gemMesh);

    // Right Arm
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.32, 0.52, 0);
    pelvis.add(rightShoulder);
    this.bones.rightShoulder = rightShoulder;

    const rightUpperArm = new THREE.Mesh(armGeo, this.suitMaterial);
    rightUpperArm.position.y = -0.16;
    rightUpperArm.castShadow = true;
    rightShoulder.add(rightUpperArm);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.32;
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
    leftHip.position.set(-0.15, 0, 0);
    pelvis.add(leftHip);
    this.bones.leftHip = leftHip;

    const legGeo = new THREE.BoxGeometry(0.16, 0.45, 0.16);
    const leftThigh = new THREE.Mesh(legGeo, this.suitMaterial);
    leftThigh.position.y = -0.22;
    leftThigh.castShadow = true;
    leftHip.add(leftThigh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.45;
    leftHip.add(leftKnee);
    this.bones.leftKnee = leftKnee;

    const shinGeo = new THREE.BoxGeometry(0.14, 0.42, 0.14);
    const leftShin = new THREE.Mesh(shinGeo, this.suitMaterial);
    leftShin.position.y = -0.21;
    leftShin.castShadow = true;
    leftKnee.add(leftShin);

    const shoeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.26);
    const leftShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    leftShoe.position.set(0, -0.44, 0.05);
    leftKnee.add(leftShoe);

    // Right Leg
    const rightHip = new THREE.Group();
    rightHip.position.set(0.15, 0, 0);
    pelvis.add(rightHip);
    this.bones.rightHip = rightHip;

    const rightThigh = new THREE.Mesh(legGeo, this.suitMaterial);
    rightThigh.position.y = -0.22;
    rightThigh.castShadow = true;
    rightHip.add(rightThigh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.45;
    rightHip.add(rightKnee);
    this.bones.rightKnee = rightKnee;

    const rightShin = new THREE.Mesh(shinGeo, this.suitMaterial);
    rightShin.position.y = -0.21;
    rightShin.castShadow = true;
    rightKnee.add(rightShin);

    const rightShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    rightShoe.position.set(0, -0.44, 0.05);
    rightKnee.add(rightShoe);

    // Dynamic ground shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.45, 20);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4
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
    ctx.fillStyle = 'rgba(15, 17, 22, 0.85)';
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

  update(dt, inputDir, isSprint, isJumpPressed) {
    this.animTime += dt;

    if (this.state === 'driving') {
      this.shadowDisc.visible = false;
      this.titleSprite.visible = false;
      return;
    }

    this.shadowDisc.visible = true;
    this.titleSprite.visible = true;
    this.shadowDisc.position.set(this.position.x, 0.02, this.position.z);

    // Action timer cooldowns (punch, throw, pose)
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'idle';
      }
    }

    // Apply movement
    const moveLen = inputDir.length();
    const currentSpeed = isSprint ? this.sprintSpeed : this.walkSpeed;

    if (this.state !== 'punch' && this.state !== 'throw' && this.state !== 'calm_pose') {
      if (moveLen > 0.05) {
        this.speed = currentSpeed;
        const targetRot = Math.atan2(inputDir.x, inputDir.z);

        // Smooth rotation
        let diff = targetRot - this.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotation.y += diff * Math.min(1, dt * 12);

        // Move position
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        this.position.addScaledVector(forward, this.speed * dt);

        if (this.isGrounded) {
          this.state = isSprint ? 'run' : 'walk';

          // Footstep audio trigger
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

    // Gravity & Ground collision
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // Run Procedural Animation based on state
    this.animate(dt);
  }

  animate(dt) {
    const b = this.bones;
    const t = this.animTime;

    if (this.state === 'idle') {
      // Subtle gangster breathing and hat tilt
      b.torso.position.y = 0.3 + Math.sin(t * 2) * 0.015;
      b.head.rotation.y = Math.sin(t * 0.8) * 0.1;
      b.head.rotation.x = Math.sin(t * 1.2) * 0.03;

      // Rest arms comfortably
      b.leftShoulder.rotation.x = 0.05 + Math.sin(t * 1.5) * 0.02;
      b.leftElbow.rotation.x = -0.2;
      b.rightShoulder.rotation.x = 0.05 - Math.sin(t * 1.5) * 0.02;
      b.rightElbow.rotation.x = -0.2;

      // Legs straight
      b.leftHip.rotation.x = 0;
      b.rightHip.rotation.x = 0;
      b.leftKnee.rotation.x = 0;
      b.rightKnee.rotation.x = 0;
    }
    else if (this.state === 'walk') {
      const freq = 8;
      const swing = Math.sin(t * freq);

      // Gangster swagger arm swing
      b.leftShoulder.rotation.x = swing * 0.5;
      b.rightShoulder.rotation.x = -swing * 0.5;
      b.leftElbow.rotation.x = -0.3 + Math.abs(swing) * 0.2;
      b.rightElbow.rotation.x = -0.3 + Math.abs(swing) * 0.2;

      // Legs cycle
      b.leftHip.rotation.x = -swing * 0.6;
      b.rightHip.rotation.x = swing * 0.6;
      b.leftKnee.rotation.x = swing > 0 ? swing * 0.6 : 0;
      b.rightKnee.rotation.x = swing < 0 ? -swing * 0.6 : 0;

      // Pelvis subtle bob
      b.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * freq)) * 0.04;
      b.torso.rotation.y = swing * 0.08;
    }
    else if (this.state === 'run') {
      const freq = 14;
      const swing = Math.sin(t * freq);

      // Fast forward lean
      b.torso.rotation.x = 0.2;
      b.leftShoulder.rotation.x = swing * 0.9;
      b.rightShoulder.rotation.x = -swing * 0.9;
      b.leftElbow.rotation.x = -0.6;
      b.rightElbow.rotation.x = -0.6;

      b.leftHip.rotation.x = -swing * 0.9;
      b.rightHip.rotation.x = swing * 0.9;
      b.leftKnee.rotation.x = swing > 0 ? swing * 0.9 : 0.1;
      b.rightKnee.rotation.x = swing < 0 ? -swing * 0.9 : 0.1;

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
      // Right jab punch
      b.rightShoulder.rotation.x = -1.4;
      b.rightElbow.rotation.x = 0;
      b.torso.rotation.y = -0.4;
      b.leftShoulder.rotation.x = 0.3;
      b.leftElbow.rotation.x = -0.8;
    }
    else if (this.state === 'throw') {
      // Throw money: swing left arm forward displaying the ring
      b.leftShoulder.rotation.x = -1.3;
      b.leftElbow.rotation.x = -0.2;
      b.torso.rotation.y = 0.3;
    }
    else if (this.state === 'calm_pose') {
      // Tipping fedora hat brim with right hand, looking calm & serious
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

    // Visual punch sparkle
    this.createImpactSparks();
  }

  throwCash() {
    if (this.state === 'driving') return;
    this.state = 'throw';
    this.actionTimer = 0.45;
    window.soundEngine.playCashThrow();

    // Spawn flying cash notes in 3D
    this.spawnFlyingCash();
  }

  calmPose() {
    this.state = 'calm_pose';
    this.actionTimer = 1.2;
    window.soundEngine.playCalmFocus();
  }

  createImpactSparks() {
    const sparkGeo = new THREE.BufferGeometry();
    const count = 12;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 0.4;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.06,
      transparent: true,
      opacity: 0.9
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);

    // Position at fist
    const fistPos = new THREE.Vector3(0.3, 1.4, 0.7).applyEuler(this.rotation).add(this.position);
    sparks.position.copy(fistPos);
    this.scene.add(sparks);

    let fade = 0;
    const interval = setInterval(() => {
      fade += 0.1;
      sparks.scale.multiplyScalar(1.15);
      sparkMat.opacity -= 0.15;
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

    const billGeo = new THREE.PlaneGeometry(0.18, 0.09);
    const billMat = new THREE.MeshBasicMaterial({
      color: 0x44bb55,
      side: THREE.DoubleSide
    });

    const bills = [];
    for (let i = 0; i < 6; i++) {
      const bill = new THREE.Mesh(billGeo, billMat);
      bill.position.set(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      bill.velocity = forward.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8 + 0.2, (Math.random() - 0.5) * 0.8))
        .multiplyScalar(3.5);
      bill.rotSpeed = new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      cashGroup.add(bill);
      bills.push(bill);
    }
    this.scene.add(cashGroup);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.04;
      bills.forEach(b => {
        b.position.addScaledVector(b.velocity, 0.04);
        b.velocity.y -= 0.1; // gravity
        b.rotation.x += b.rotSpeed.x * 0.04;
        b.rotation.y += b.rotSpeed.y * 0.04;
      });
      if (life >= 0.8) {
        clearInterval(interval);
        this.scene.remove(cashGroup);
        billGeo.dispose();
        billMat.dispose();
      }
    }, 40);
  }
}

window.MichelleCharacter = MichelleCharacter;

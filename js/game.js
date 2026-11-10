/**
 * Michelle De Santa 3D - Master Game Controller
 * Fixed Camera-Relative Movement (Zero Inversion), Full Collision System,
 * and Enhanced Visuals (Rain Particle System, Volumetric Cones, Glow & Reflections).
 */

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('webgl-canvas');

    this.keys = {};
    this.touchJoystick = { x: 0, y: 0, active: false };
    this.isCalmFocusActive = false;
    this.timeScale = 1.0;

    this.inCar = false;

    this.initThree();
    this.initWeather();
    this.initAudioAndSystems();
    this.initInputs();
    this.initMinimap();

    // Start game loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Start first mission
    setTimeout(() => {
      this.missions.startMission(0);
    }, 1000);
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090b0f);
    this.scene.fog = new THREE.FogExp2(0x090b0f, 0.014);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 4, 11);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x282f40, 1.4);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xb0d0ff, 1.5);
    moonLight.position.set(-50, 70, -60);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 180;
    const d = 60;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    moonLight.shadow.bias = -0.0004;
    this.scene.add(moonLight);

    // Subtle warm rim light for noir contrast
    const rimLight = new THREE.DirectionalLight(0xffbe76, 0.65);
    rimLight.position.set(40, 30, 50);
    this.scene.add(rimLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initWeather() {
    // Atmospheric Falling Rain Streaks (Noir Mood)
    const rainCount = 750;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 6); // 2 vertices per line streak

    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 100;
      const ry = Math.random() * 30 + 0.5;
      const rz = (Math.random() - 0.5) * 100;

      rainPos[i * 6] = rx;
      rainPos[i * 6 + 1] = ry;
      rainPos[i * 6 + 2] = rz;

      // Streak tail tilted with slight wind
      rainPos[i * 6 + 3] = rx - 0.15;
      rainPos[i * 6 + 4] = ry - 0.8;
      rainPos[i * 6 + 5] = rz - 0.05;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x88bbdd,
      transparent: true,
      opacity: 0.35
    });

    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.scene.add(this.rainLines);
  }

  updateWeather(dt) {
    if (!this.rainLines) return;
    const pos = this.rainLines.geometry.attributes.position.array;
    const fallSpeed = 38 * dt;

    for (let i = 0; i < pos.length / 6; i++) {
      pos[i * 6 + 1] -= fallSpeed;
      pos[i * 6 + 4] -= fallSpeed;

      // Wrap around
      if (pos[i * 6 + 1] < 0) {
        const newY = 30 + Math.random() * 5;
        pos[i * 6 + 1] = newY;
        pos[i * 6 + 4] = newY - 0.8;

        // Keep centered around player
        pos[i * 6] = this.player.position.x + (Math.random() - 0.5) * 80;
        pos[i * 6 + 3] = pos[i * 6] - 0.15;
        pos[i * 6 + 2] = this.player.position.z + (Math.random() - 0.5) * 80;
        pos[i * 6 + 5] = pos[i * 6 + 2] - 0.05;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }

  initAudioAndSystems() {
    this.world = new CityWorld(this.scene);

    this.player = new MichelleCharacter(this.scene);
    this.player.position.set(0, 0, 4);

    this.car = new MafiaCar(this.scene);
    this.car.position.set(-6, 0, 0);
    this.car.rotation.y = Math.PI / 2;

    this.missions = new MissionManager(this);

    // Camera follow parameters
    this.cameraAngle = Math.PI; // Starts behind player facing North (-Z)
    this.cameraPitch = 0.28;
    this.cameraDist = 5.8;
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      window.soundEngine.ensureContext();

      if (e.code === 'KeyE') {
        this.toggleCarEnterExit();
      } else if (e.code === 'KeyF') {
        if (!this.inCar) this.player.punch();
        else this.car.honk();
      } else if (e.code === 'KeyQ') {
        if (!this.inCar) this.player.throwCash();
      } else if (e.code === 'KeyC') {
        this.triggerCalmFocus();
      } else if (e.code === 'KeyH') {
        if (this.inCar) this.car.honk();
      } else if (e.code === 'KeyL') {
        if (this.inCar) this.car.toggleHeadlights();
      } else if (e.code === 'KeyM') {
        this.toggleAudio();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse drag for camera orbit
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('#slide-modal')) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        this.cameraAngle += dx * 0.0055;
        this.cameraPitch = Math.max(0.06, Math.min(1.15, this.cameraPitch + dy * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    window.addEventListener('wheel', (e) => {
      this.cameraDist = Math.max(2.6, Math.min(14, this.cameraDist + e.deltaY * 0.005));
    });

    this.initTouchControls();

    document.getElementById('btn-sound').onclick = () => this.toggleAudio();
    document.getElementById('btn-slide').onclick = () => this.openSlideModal();
    document.getElementById('modal-close').onclick = () => this.closeSlideModal();
  }

  initTouchControls() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const touchPanel = document.getElementById('touch-controls');
    if (isTouchDevice && touchPanel) {
      touchPanel.classList.add('active');
    }

    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    if (!zone || !knob) return;

    let touchId = null;
    let rect = null;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.soundEngine.ensureContext();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      rect = zone.getBoundingClientRect();
      this.updateJoystick(touch.clientX, touch.clientY, rect, knob);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          this.updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY, rect, knob);
          break;
        }
      }
    }, { passive: false });

    const endHandler = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          this.touchJoystick.x = 0;
          this.touchJoystick.y = 0;
          this.touchJoystick.active = false;
          knob.style.transform = `translate(0px, 0px)`;
          break;
        }
      }
    };

    zone.addEventListener('touchend', endHandler);
    zone.addEventListener('touchcancel', endHandler);

    this.bindTouchButton('btn-touch-drive', () => this.toggleCarEnterExit());
    this.bindTouchButton('btn-touch-punch', () => {
      if (!this.inCar) this.player.punch();
      else this.car.honk();
    });
    this.bindTouchButton('btn-touch-jump', () => {
      this.keys['Space'] = true;
      setTimeout(() => { this.keys['Space'] = false; }, 150);
    });
    this.bindTouchButton('btn-touch-cash', () => {
      if (!this.inCar) this.player.throwCash();
    });
    this.bindTouchButton('btn-touch-calm', () => {
      this.triggerCalmFocus();
    });
  }

  bindTouchButton(id, callback) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.soundEngine.ensureContext();
      callback();
    }, { passive: false });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      callback();
    });
  }

  updateJoystick(cx, cy, rect, knob) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = cx - centerX;
    let dy = cy - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.touchJoystick.x = dx / maxRadius;
    this.touchJoystick.y = dy / maxRadius;
    this.touchJoystick.active = true;
  }

  toggleCarEnterExit() {
    if (this.inCar) {
      this.inCar = false;
      this.car.exitCar();
      this.player.state = 'idle';
      this.player.group.visible = true;

      const sidePos = new THREE.Vector3(-1.9, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.car.rotation.y);
      this.player.position.copy(this.car.position).add(sidePos);
      this.player.position.y = 0;

      document.getElementById('car-hud').classList.remove('visible');
      document.getElementById('btn-touch-drive').querySelector('label').textContent = 'Drive';
      this.showToast("Exited De Santa V8");
    } else {
      const dist = this.player.position.distanceTo(this.car.position);
      if (dist < 4.5) {
        this.inCar = true;
        this.car.enterCar();
        this.player.state = 'driving';
        this.player.group.visible = false;

        document.getElementById('car-hud').classList.add('visible');
        document.getElementById('btn-touch-drive').querySelector('label').textContent = 'Exit';
        this.showToast("Driving De Santa V8 Roadster");
      }
    }
  }

  triggerCalmFocus() {
    if (this.isCalmFocusActive) return;
    this.isCalmFocusActive = true;
    this.player.calmPose();

    const vignette = document.getElementById('noir-vignette');
    const notice = document.getElementById('slowmo-notice');
    if (vignette) vignette.classList.add('calm-focus');
    if (notice) notice.classList.add('active');

    this.timeScale = 0.25;

    setTimeout(() => {
      this.timeScale = 1.0;
      this.isCalmFocusActive = false;
      if (vignette) vignette.classList.remove('calm-focus');
      if (notice) notice.classList.remove('active');
    }, 2500);
  }

  toggleAudio() {
    const isMuted = window.soundEngine.toggleMute();
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = isMuted ? '🔇' : '🎵';
  }

  setObjective(text) {
    const el = document.getElementById('current-objective');
    if (el) el.textContent = text;
  }

  showDialog(speaker, text, portraitUrl) {
    const dialogBox = document.getElementById('dialog-box');
    const speakerEl = document.getElementById('dialog-speaker');
    const textEl = document.getElementById('dialog-text');
    const imgEl = document.getElementById('dialog-avatar');

    if (speakerEl) speakerEl.textContent = speaker;
    if (imgEl && portraitUrl) imgEl.src = portraitUrl;

    if (dialogBox && textEl) {
      dialogBox.classList.add('visible');
      textEl.textContent = '';
      window.soundEngine.playTypewriter();

      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          textEl.textContent += text[i];
          if (i % 3 === 0) window.soundEngine.playTypewriter();
          i++;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            dialogBox.classList.remove('visible');
          }, 4500);
        }
      }, 25);
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  openSlideModal() {
    const modal = document.getElementById('slide-modal');
    if (modal) modal.classList.add('open');
  }

  closeSlideModal() {
    const modal = document.getElementById('slide-modal');
    if (modal) modal.classList.remove('open');
  }

  updateHUDStats() {
    const loyaltyFill = document.getElementById('stat-loyalty');
    const cashEl = document.getElementById('stat-cash');
    if (loyaltyFill) loyaltyFill.style.width = `${this.missions.loyaltyScore}%`;
    if (cashEl) cashEl.textContent = `$${this.missions.cashBalance}`;
  }

  initMinimap() {
    this.mmCanvas = document.getElementById('minimap-canvas');
    if (this.mmCanvas) {
      this.mmCanvas.width = 110;
      this.mmCanvas.height = 110;
      this.mmCtx = this.mmCanvas.getContext('2d');
    }
  }

  drawMinimap() {
    if (!this.mmCtx) return;
    const ctx = this.mmCtx;
    const w = this.mmCanvas.width;
    const h = this.mmCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.65;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#101218';
    ctx.fillRect(0, 0, w, h);

    // City grid
    ctx.strokeStyle = '#2b313d';
    ctx.lineWidth = 14 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Car icon
    const carPos = this.car.position;
    const cMapX = cx + (carPos.x - this.player.position.x) * scale;
    const cMapY = cy + (carPos.z - this.player.position.z) * scale;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(cMapX, cMapY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mission objective marker
    if (this.missions.currentMission && this.missions.currentMission.targetPos) {
      const tgt = this.missions.currentMission.targetPos;
      const tMapX = cx + (tgt.x - this.player.position.x) * scale;
      const tMapY = cy + (tgt.z - this.player.position.z) * scale;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(tMapX, tMapY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.player.rotation.y);
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const rawDt = Math.min(this.clock.getDelta(), 0.1);
    const dt = rawDt * this.timeScale;

    // Movement Inputs
    let fwdInput = 0;  // +1 = forward (W), -1 = backward (S)
    let strafeInput = 0; // +1 = right (D), -1 = left (A)

    if (this.keys['KeyW'] || this.keys['ArrowUp']) fwdInput += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) fwdInput -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) strafeInput += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafeInput -= 1;

    // Mobile touch joystick:
    // Pushing joystick UP (ty < 0) -> move forward (+1)
    // Pushing joystick DOWN (ty > 0) -> move backward (-1)
    // Pushing joystick RIGHT (tx > 0) -> move right (+1)
    // Pushing joystick LEFT (tx < 0) -> move left (-1)
    if (this.touchJoystick.active) {
      fwdInput = -this.touchJoystick.y;
      strafeInput = this.touchJoystick.x;
    }

    const isSprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    const isJump = !!this.keys['Space'];

    if (!this.inCar) {
      // ---- STANDARD CAMERA-RELATIVE MOVEMENT (ZERO INVERSION) ----
      // Camera Forward on ground plane: direction from camera towards player
      const camFwdX = -Math.sin(this.cameraAngle);
      const camFwdZ = -Math.cos(this.cameraAngle);
      const camForward = new THREE.Vector3(camFwdX, 0, camFwdZ).normalize();

      // Camera Right on ground plane: perpendicular to forward (screen right)
      const camRight = new THREE.Vector3(-camFwdZ, 0, camFwdX).normalize();

      // Calculate world movement direction
      const moveDir = new THREE.Vector3()
        .addScaledVector(camForward, fwdInput)
        .addScaledVector(camRight, strafeInput);

      if (moveDir.length() > 0.05) {
        moveDir.normalize();
        this.player.update(dt, moveDir, isSprint, isJump, this.world);
      } else {
        this.player.update(dt, new THREE.Vector3(), false, isJump, this.world);
      }

      this.car.update(dt, 0, 0, false, this.world);

      // Check proximity to car for prompt
      const distToCar = this.player.position.distanceTo(this.car.position);
      const hint = document.getElementById('action-hint');
      if (distToCar < 4.2) {
        this.car.promptSprite.visible = true;
        if (hint) {
          hint.textContent = "[E] Drive De Santa V8";
          hint.classList.add('visible');
        }
      } else {
        this.car.promptSprite.visible = false;
        if (hint) hint.classList.remove('visible');
      }

      // Smooth camera follow behind Michelle
      const targetCamPos = this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const camOffset = new THREE.Vector3(
        Math.sin(this.cameraAngle) * this.cameraDist * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch) * this.cameraDist,
        Math.cos(this.cameraAngle) * this.cameraDist * Math.cos(this.cameraPitch)
      );
      this.camera.position.lerp(targetCamPos.clone().add(camOffset), dt * 8);
      this.camera.lookAt(targetCamPos.clone().add(new THREE.Vector3(0, 0.4, 0)));
    } else {
      // Driving V8 Roadster
      const steer = strafeInput; // +1 = turn right, -1 = turn left
      const accel = fwdInput;    // +1 = accelerate, -1 = brake/reverse
      this.car.update(dt, steer, accel, isJump, this.world);

      this.player.position.copy(this.car.position);
      this.player.rotation.y = this.car.rotation.y;

      const speedKm = Math.round(Math.abs(this.car.speed) * 4.2);
      const speedEl = document.getElementById('gauge-speed');
      if (speedEl) speedEl.textContent = speedKm;

      // Chase camera behind car
      const carForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.car.rotation.y);
      const targetCamPos = this.car.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      const behindCar = targetCamPos.clone().addScaledVector(carForward, -7.5).add(new THREE.Vector3(0, 3.2, 0));

      this.camera.position.lerp(behindCar, dt * 6.0);
      this.camera.lookAt(targetCamPos.clone().addScaledVector(carForward, 5));
    }

    // Weather & environment updates
    this.updateWeather(dt);
    this.world.update(dt);
    this.missions.update(dt);

    this.drawMinimap();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});

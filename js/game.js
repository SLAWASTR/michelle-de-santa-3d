/**
 * Michelle De Santa 3D - Master Game Controller
 * Orchestrates Three.js rendering, physics, cameras, input, HUD, and mobile controls.
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
    this.scene.background = new THREE.Color(0x0a0c10); // Noir deep midnight
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 4, -7);

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
    this.renderer.toneMappingExposure = 1.1;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x222633, 1.2);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xaaccff, 1.4);
    moonLight.position.set(40, 60, -30);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 150;
    const d = 50;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Subtle warm rim light
    const rimLight = new THREE.DirectionalLight(0xffcc88, 0.6);
    rimLight.position.set(-30, 20, 40);
    this.scene.add(rimLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initAudioAndSystems() {
    // World / City
    this.world = new CityWorld(this.scene);

    // Character: Michelle De Santa
    this.player = new MichelleCharacter(this.scene);
    this.player.position.set(0, 0, 4);

    // Vintage Mafia Car: De Santa V8
    this.car = new MafiaCar(this.scene);
    this.car.position.set(-6, 0, 0);
    this.car.rotation.y = Math.PI / 2;

    // Mission System
    this.missions = new MissionManager(this);

    // Camera follow targets
    this.cameraAngle = Math.PI;
    this.cameraPitch = 0.25;
    this.cameraDist = 5.5;
  }

  initInputs() {
    // Keyboard
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

    // Mouse drag for camera
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
        this.cameraAngle -= dx * 0.006;
        this.cameraPitch = Math.max(0.05, Math.min(1.1, this.cameraPitch + dy * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    window.addEventListener('wheel', (e) => {
      this.cameraDist = Math.max(2.5, Math.min(12, this.cameraDist + e.deltaY * 0.005));
    });

    // Mobile / Touch controls
    this.initTouchControls();

    // UI Buttons
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

    // On-screen action buttons
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
      // Exit car
      this.inCar = false;
      this.car.exitCar();
      this.player.state = 'idle';
      this.player.group.visible = true;

      // Position Michelle next to car door
      const sidePos = new THREE.Vector3(-1.8, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.car.rotation.y);
      this.player.position.copy(this.car.position).add(sidePos);
      this.player.position.y = 0;

      document.getElementById('car-hud').classList.remove('visible');
      document.getElementById('btn-touch-drive').querySelector('label').textContent = 'Drive';
      this.showToast("Exited De Santa V8");
    } else {
      // Enter car check distance
      const dist = this.player.position.distanceTo(this.car.position);
      if (dist < 4.5) {
        this.inCar = true;
        this.car.enterCar();
        this.player.state = 'driving';
        this.player.group.visible = false; // Seated inside

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

    // Bullet-time slow motion for 2.5 seconds
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
    const scale = 0.7; // City world units to minimap pixels

    ctx.clearRect(0, 0, w, h);

    // Dark radar background
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, w, h);

    // City grid roads
    ctx.strokeStyle = '#2d3340';
    ctx.lineWidth = 14 * scale;
    // Main avenue
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Car icon (blue dot)
    const carPos = this.car.position;
    const cMapX = cx + (carPos.x - this.player.position.x) * scale;
    const cMapY = cy + (carPos.z - this.player.position.z) * scale;
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(cMapX, cMapY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mission objective marker (gold star / dot)
    if (this.missions.currentMission && this.missions.currentMission.targetPos) {
      const tgt = this.missions.currentMission.targetPos;
      const tMapX = cx + (tgt.x - this.player.position.x) * scale;
      const tMapY = cy + (tgt.z - this.player.position.z) * scale;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(tMapX, tMapY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player arrow in center
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

    // Read Movement Inputs
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX -= 1;

    // Apply Touch Joystick
    if (this.touchJoystick.active) {
      moveX = -this.touchJoystick.x;
      moveZ = -this.touchJoystick.y;
    }

    const isSprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    const isJump = !!this.keys['Space'];

    if (!this.inCar) {
      // Pedestrian Michelle movement
      const inputVector = new THREE.Vector3(moveX, 0, moveZ);
      if (inputVector.length() > 0.1) {
        // Transform input direction relative to camera heading
        const camAngle = this.cameraAngle;
        const rotatedDir = new THREE.Vector3(
          -inputVector.x * Math.cos(camAngle) + inputVector.z * Math.sin(camAngle),
          0,
          inputVector.x * Math.sin(camAngle) + inputVector.z * Math.cos(camAngle)
        ).normalize();
        this.player.update(dt, rotatedDir, isSprint, isJump);
      } else {
        this.player.update(dt, new THREE.Vector3(), false, isJump);
      }

      // Update car idle
      this.car.update(dt, 0, 0, false);

      // Check proximity to car for prompt
      const distToCar = this.player.position.distanceTo(this.car.position);
      const hint = document.getElementById('action-hint');
      if (distToCar < 4.0) {
        this.car.promptSprite.visible = true;
        if (hint) {
          hint.textContent = "[E] Drive De Santa V8";
          hint.classList.add('visible');
        }
      } else {
        this.car.promptSprite.visible = false;
        if (hint) hint.classList.remove('visible');
      }

      // Camera follows Michelle
      const targetCamPos = this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const camOffset = new THREE.Vector3(
        Math.sin(this.cameraAngle) * this.cameraDist * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch) * this.cameraDist,
        Math.cos(this.cameraAngle) * this.cameraDist * Math.cos(this.cameraPitch)
      );
      this.camera.position.lerp(targetCamPos.clone().add(camOffset), dt * 7);
      this.camera.lookAt(targetCamPos.clone().add(new THREE.Vector3(0, 0.4, 0)));
    } else {
      // Driving De Santa V8
      const steerInput = -moveX;
      const accelInput = moveZ;
      this.car.update(dt, steerInput, accelInput, isJump);

      // Keep Michelle's hidden body synced with car
      this.player.position.copy(this.car.position);
      this.player.rotation.y = this.car.rotation.y;

      // Update Car HUD speedometer
      const speedKm = Math.round(Math.abs(this.car.speed) * 4.2);
      const speedEl = document.getElementById('gauge-speed');
      if (speedEl) speedEl.textContent = speedKm;

      // Chase Camera behind car
      const carForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.car.rotation.y);
      const targetCamPos = this.car.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      const behindCar = targetCamPos.clone().addScaledVector(carForward, -7.5).add(new THREE.Vector3(0, 3.2, 0));

      this.camera.position.lerp(behindCar, dt * 5.5);
      this.camera.lookAt(targetCamPos.clone().addScaledVector(carForward, 5));
    }

    // World & missions
    this.world.update(dt);
    this.missions.update(dt);

    // Minimap
    this.drawMinimap();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});

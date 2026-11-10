/**
 * Michelle De Santa 3D - Master Game Controller
 * Starts in V8 Roadster by default (Instant Driving Action),
 * Dynamic Speed FOV, High-Octane Physics, and Seamless Walking/Driving toggle.
 */

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('webgl-canvas');

    this.keys = {};
    this.touchJoystick = { x: 0, y: 0, active: false };
    this.isCalmFocusActive = false;
    this.timeScale = 1.0;

    // Start already seated in car for instant thrilling drive!
    this.inCar = true;

    // GTA 3 HUD & Clock State
    this.inGameMinutes = 22 * 60 + 45; // 22:45
    this._lastClockTick = performance.now();
    this.health = 100;
    this.armor = 100;

    this.initThree();
    this.initWeather();
    this.initAudioAndSystems();
    this.initInputs();
    this.initMinimap();
    this.updateHUDStats();

    // Start game loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Initial vehicle banner and first mission
    setTimeout(() => {
      this.showVehicleBanner("DE SANTA ROADSTER V8");
    }, 400);

    setTimeout(() => {
      this.missions.startMission(0);
      this.showToast("★ DRIVING DE SANTA V8: Press W to accelerate, A/D to steer, E to exit on foot ★");
    }, 900);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080a0e);
    this.scene.fog = new THREE.FogExp2(0x080a0e, 0.013);

    this.camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
    this.baseFov = 62;
    this.camera.position.set(0, 4, 12);

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
    this.renderer.toneMappingExposure = 1.25;

    // Rich Cinema Lighting
    const ambientLight = new THREE.AmbientLight(0x2d3448, 1.5);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xbcd6ff, 1.6);
    moonLight.position.set(-60, 80, -70);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 200;
    const d = 65;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    moonLight.shadow.bias = -0.0003;
    this.scene.add(moonLight);

    const goldFill = new THREE.DirectionalLight(0xffcc77, 0.7);
    goldFill.position.set(50, 30, 40);
    this.scene.add(goldFill);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initWeather() {
    const rainCount = 800;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 6);

    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 110;
      const ry = Math.random() * 32 + 0.5;
      const rz = (Math.random() - 0.5) * 110;

      rainPos[i * 6] = rx;
      rainPos[i * 6 + 1] = ry;
      rainPos[i * 6 + 2] = rz;

      rainPos[i * 6 + 3] = rx - 0.16;
      rainPos[i * 6 + 4] = ry - 0.85;
      rainPos[i * 6 + 5] = rz - 0.05;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x99ccff,
      transparent: true,
      opacity: 0.38
    });

    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.scene.add(this.rainLines);
  }

  updateWeather(dt) {
    if (!this.rainLines) return;
    const pos = this.rainLines.geometry.attributes.position.array;
    const fallSpeed = 40 * dt;
    const focusPos = this.inCar ? this.car.position : this.player.position;

    for (let i = 0; i < pos.length / 6; i++) {
      pos[i * 6 + 1] -= fallSpeed;
      pos[i * 6 + 4] -= fallSpeed;

      if (pos[i * 6 + 1] < 0) {
        const newY = 32 + Math.random() * 4;
        pos[i * 6 + 1] = newY;
        pos[i * 6 + 4] = newY - 0.85;

        pos[i * 6] = focusPos.x + (Math.random() - 0.5) * 85;
        pos[i * 6 + 3] = pos[i * 6] - 0.16;
        pos[i * 6 + 2] = focusPos.z + (Math.random() - 0.5) * 85;
        pos[i * 6 + 5] = pos[i * 6 + 2] - 0.05;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }

  initAudioAndSystems() {
    this.world = new CityWorld(this.scene);

    // Car spawned on main boulevard
    this.car = new MafiaCar(this.scene);
    this.car.position.set(0, 0, 5);
    this.car.rotation.y = 0; // Pointing North along avenue!

    // Player character (synced with car at start)
    this.player = new MichelleCharacter(this.scene);
    this.player.position.set(0, 0, 5);
    this.player.state = 'driving';
    this.player.group.visible = false; // Seated driver inside car is visible!

    // Show Car HUD
    const carHud = document.getElementById('car-hud');
    if (carHud) carHud.classList.add('visible');

    this.missions = new MissionManager(this);

    // Camera parameters
    this.cameraAngle = Math.PI;
    this.cameraPitch = 0.28;
    this.cameraDist = 6.2;
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
      this.cameraDist = Math.max(3.0, Math.min(15, this.cameraDist + e.deltaY * 0.005));
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
      // Exit Car safely without collision clipping
      this.inCar = false;
      this.car.exitCar();
      this.player.state = 'idle';
      this.player.group.visible = true;

      // Test multiple exit positions around the car to ensure player never spawns in a wall
      const carRot = this.car.rotation.y;
      const candidates = [
        new THREE.Vector3(-2.2, 0, 0),   // Driver side (left)
        new THREE.Vector3(2.2, 0, 0),    // Passenger side (right)
        new THREE.Vector3(0, 0, -3.2),   // Rear
        new THREE.Vector3(0, 0, 3.2),    // Front
        new THREE.Vector3(-1.8, 0, -1.8),
        new THREE.Vector3(1.8, 0, -1.8)
      ];

      let safeX = this.car.position.x - 2.2;
      let safeZ = this.car.position.z;
      let foundClearSpot = false;

      for (const off of candidates) {
        const testPos = off.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot).add(this.car.position);
        if (this.world && this.world.resolveCollision) {
          const res = this.world.resolveCollision(testPos.x, testPos.z, this.player.radius + 0.2);
          if (!res.collided) {
            safeX = testPos.x;
            safeZ = testPos.z;
            foundClearSpot = true;
            break;
          }
        }
      }

      if (!foundClearSpot && this.world && this.world.resolveCollision) {
        // Fallback: resolve from default driver side
        const defPos = new THREE.Vector3(-2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot).add(this.car.position);
        const res = this.world.resolveCollision(defPos.x, defPos.z, this.player.radius);
        safeX = res.x;
        safeZ = res.z;
      }

      // Safeguard against NaN
      if (!isFinite(safeX) || !isFinite(safeZ)) {
        safeX = 0;
        safeZ = 5;
      }

      this.player.position.set(safeX, 0, safeZ);
      this.player.velocity.set(0, 0, 0);
      this.player.isGrounded = true;

      const carHud = document.getElementById('car-hud');
      if (carHud) carHud.classList.remove('visible');

      const carBanner = document.getElementById('car-name-banner');
      if (carBanner) carBanner.classList.remove('visible');

      const dBtn = document.getElementById('btn-touch-drive');
      if (dBtn) {
        const lbl = dBtn.querySelector('label');
        if (lbl) lbl.textContent = 'Drive';
      }
      this.showToast("Exited De Santa V8 — Walking on foot");
    } else {
      // Enter Car within 8 meters
      const dist = this.player.position.distanceTo(this.car.position);
      if (dist < 8.0) {
        this.inCar = true;
        this.car.enterCar();
        this.player.state = 'driving';
        this.player.group.visible = false;
        this.player.position.copy(this.car.position);

        this.showVehicleBanner("DE SANTA ROADSTER V8");

        const carHud = document.getElementById('car-hud');
        if (carHud) carHud.classList.add('visible');

        const dBtn = document.getElementById('btn-touch-drive');
        if (dBtn) {
          const lbl = dBtn.querySelector('label');
          if (lbl) lbl.textContent = 'Exit';
        }
        this.showToast("Driving De Santa V8 Roadster");
      } else {
        this.showToast("Get closer to the V8 Roadster to drive!");
      }
    }
  }

  showVehicleBanner(title) {
    const banner = document.getElementById('car-name-banner');
    const titleEl = document.getElementById('car-banner-title');
    if (titleEl) titleEl.textContent = title;
    if (banner) {
      banner.classList.add('visible');
      clearTimeout(this._bannerTimer);
      this._bannerTimer = setTimeout(() => {
        banner.classList.remove('visible');
      }, 4200);
    }
  }

  showMissionPassed(rewardText = "+$500") {
    const banner = document.getElementById('mission-passed-banner');
    const rewEl = document.getElementById('passed-reward-text');
    if (rewEl) rewEl.textContent = rewardText;
    if (banner) {
      banner.classList.add('show');
      setTimeout(() => {
        banner.classList.remove('show');
      }, 3500);
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
    // Profile card stats
    const loyaltyFill = document.getElementById('stat-loyalty');
    const cashEl = document.getElementById('stat-cash');
    if (loyaltyFill && this.missions) loyaltyFill.style.width = `${this.missions.loyaltyScore}%`;
    if (cashEl && this.missions) cashEl.textContent = `$${this.missions.cashBalance}`;

    // GTA 3 Iconic Stats Cluster
    const hudHealth = document.getElementById('hud-health-val');
    const hudArmor = document.getElementById('hud-armor-val');
    const hudCash = document.getElementById('hud-cash-val');
    const gtaClock = document.getElementById('gta-clock');

    if (hudHealth) hudHealth.textContent = this.health;
    if (hudArmor) hudArmor.textContent = this.armor;

    if (hudCash && this.missions) {
      // Classic GTA leading zeroes: e.g. $00001200
      const cashStr = String(Math.max(0, this.missions.cashBalance)).padStart(8, '0');
      hudCash.textContent = `$${cashStr}`;
    }

    if (gtaClock) {
      const hh = String(Math.floor(this.inGameMinutes / 60) % 24).padStart(2, '0');
      const mm = String(Math.floor(this.inGameMinutes % 60)).padStart(2, '0');
      gtaClock.textContent = `${hh}:${mm}`;
    }
  }

  initMinimap() {
    this.mmCanvas = document.getElementById('minimap-canvas');
    if (this.mmCanvas) {
      this.mmCanvas.width = 124;
      this.mmCanvas.height = 124;
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
    const scale = 0.58;

    ctx.clearRect(0, 0, w, h);

    // GTA 3 Dark Radar Background
    ctx.fillStyle = '#141a22';
    ctx.fillRect(0, 0, w, h);

    // City street grid
    ctx.strokeStyle = '#26303d';
    ctx.lineWidth = 16 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Secondary streets
    ctx.strokeStyle = '#1d2530';
    ctx.lineWidth = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(cx - 30 * scale, 0); ctx.lineTo(cx - 30 * scale, h);
    ctx.moveTo(cx + 30 * scale, 0); ctx.lineTo(cx + 30 * scale, h);
    ctx.moveTo(0, cy - 30 * scale); ctx.lineTo(w, cy - 30 * scale);
    ctx.moveTo(0, cy + 30 * scale); ctx.lineTo(w, cy + 30 * scale);
    ctx.stroke();

    // Radar concentric rings
    ctx.strokeStyle = 'rgba(70, 90, 115, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.28, 0, Math.PI * 2);
    ctx.arc(cx, cy, w * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    const focusPos = this.inCar ? this.car.position : this.player.position;
    const focusRot = this.inCar ? this.car.rotation.y : this.player.rotation.y;

    // Parked Cabs (yellow dots)
    if (this.world && this.world.parkedCabs) {
      ctx.fillStyle = '#ffd700';
      this.world.parkedCabs.forEach(cab => {
        const cX = cx + (cab.position.x - focusPos.x) * scale;
        const cY = cy + (cab.position.z - focusPos.z) * scale;
        if (Math.hypot(cX - cx, cY - cy) < w * 0.46) {
          ctx.beginPath();
          ctx.arc(cX, cY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // De Santa V8 Roadster icon (cyan dot when player is on foot)
    if (!this.inCar) {
      const cMapX = cx + (this.car.position.x - focusPos.x) * scale;
      const cMapY = cy + (this.car.position.z - focusPos.z) * scale;
      if (Math.hypot(cMapX - cx, cMapY - cy) < w * 0.46) {
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.arc(cMapX, cMapY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mission target beacon (flashing yellow GTA 3 blip)
    if (this.missions.currentMission && this.missions.currentMission.targetPos) {
      const tgt = this.missions.currentMission.targetPos;
      let tMapX = cx + (tgt.x - focusPos.x) * scale;
      let tMapY = cy + (tgt.z - focusPos.z) * scale;
      const distFromCenter = Math.hypot(tMapX - cx, tMapY - cy);
      const maxRadarRadius = w * 0.44;

      // Clamp to radar edge if target is off-screen
      if (distFromCenter > maxRadarRadius) {
        const angle = Math.atan2(tMapY - cy, tMapX - cx);
        tMapX = cx + Math.cos(angle) * maxRadarRadius;
        tMapY = cy + Math.sin(angle) * maxRadarRadius;
      }

      const pulse = 0.8 + Math.sin(performance.now() * 0.008) * 0.2;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(tMapX, tMapY, 5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Center Player / Car Arrow (pointing player heading)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-focusRot);
    ctx.fillStyle = this.inCar ? '#f1c40f' : '#2ecc71';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 7);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // North 'N' pointer on rim
    ctx.fillStyle = '#8ea4be';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 12);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    try {
      this.updateFrame();
    } catch (err) {
      console.error("Frame loop caught error:", err);
    }
  }

  updateFrame() {
    const rawDt = Math.min(this.clock.getDelta(), 0.1);
    const dt = rawDt * this.timeScale;

    // Smooth In-game GTA Clock: +1 in-game minute every 2.5 real seconds
    const now = performance.now();
    if (now - this._lastClockTick > 2500) {
      this.inGameMinutes++;
      this._lastClockTick = now;
      this.updateHUDStats();
    }

    // Safeguard coordinates against NaN
    if (!isFinite(this.player.position.x) || !isFinite(this.player.position.z)) {
      this.player.position.set(0, 0, 5);
      this.player.velocity.set(0, 0, 0);
    }
    if (!isFinite(this.car.position.x) || !isFinite(this.car.position.z)) {
      this.car.position.set(0, 0, 5);
      this.car.speed = 0;
    }

    // Movement Inputs
    let fwdInput = 0;
    let strafeInput = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) fwdInput += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) fwdInput -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) strafeInput += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafeInput -= 1;

    if (this.touchJoystick.active) {
      fwdInput = -this.touchJoystick.y;
      strafeInput = this.touchJoystick.x;
    }

    const isSprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    const isJump = !!this.keys['Space'];

    if (!this.inCar) {
      // Pedestrian walking
      const camFwdX = -Math.sin(this.cameraAngle);
      const camFwdZ = -Math.cos(this.cameraAngle);
      const camForward = new THREE.Vector3(camFwdX, 0, camFwdZ).normalize();
      const camRight = new THREE.Vector3(-camFwdZ, 0, camFwdX).normalize();

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

      const distToCar = this.player.position.distanceTo(this.car.position);
      const hint = document.getElementById('action-hint');
      if (distToCar < 8.0) {
        this.car.promptSprite.visible = true;
        if (hint) {
          hint.textContent = "[E] Drive De Santa V8";
          hint.classList.add('visible');
        }
      } else {
        this.car.promptSprite.visible = false;
        if (hint) hint.classList.remove('visible');
      }

      // Smooth camera follow
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.baseFov, dt * 5);
      this.camera.updateProjectionMatrix();

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
      const steer = strafeInput;
      const accel = fwdInput;
      this.car.update(dt, steer, accel, isJump, this.world);

      this.player.position.copy(this.car.position);
      this.player.rotation.y = this.car.rotation.y;

      const speedKm = Math.round(Math.abs(this.car.speed) * 4.2);
      const speedEl = document.getElementById('gauge-speed');
      if (speedEl) speedEl.textContent = speedKm;

      const bannerSpeedEl = document.getElementById('car-banner-speed');
      if (bannerSpeedEl) bannerSpeedEl.textContent = `SPEED: ${speedKm} KM/H`;

      // Speed Dynamic FOV
      const targetFov = this.baseFov + (Math.abs(this.car.speed) / this.car.maxSpeed) * 12;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 4);
      this.camera.updateProjectionMatrix();

      // GTA 3 Chase Camera
      const carForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.car.rotation.y);
      const targetCamPos = this.car.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      const behindCar = targetCamPos.clone().addScaledVector(carForward, -7.8).add(new THREE.Vector3(0, 3.4, 0));

      this.camera.position.lerp(behindCar, dt * 7.0);
      this.camera.lookAt(targetCamPos.clone().addScaledVector(carForward, 6.0));
    }

    this.updateWeather(dt);
    if (this.world) this.world.update(dt);
    if (this.missions) this.missions.update(dt);

    this.drawMinimap();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});

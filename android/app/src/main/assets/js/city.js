/**
 * Michelle De Santa 3D - High-Fidelity City World ("Santa District")
 * Features:
 * - High-res procedural textures (Brick, Glowing Windows, Marble, Asphalt)
 * - Volumetric streetlamp light cones & glowing neon signage
 * - Complete AABB & Cylinder collision system (no walking through buildings!)
 * - Starfield sky & glowing full moon
 */

class CityWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // { type: 'box', minX, maxX, minZ, maxZ } or { type: 'circle', x, z, r }
    this.pedestrians = [];
    this.volumetricCones = [];
    this.neonSigns = [];

    this.generateProceduralTextures();
    this.initCity();
  }

  generateProceduralTextures() {
    // 1. High-Detail Brick & Glowing Windows Facade Texture
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 512;
    winCanvas.height = 512;
    const wctx = winCanvas.getContext('2d');

    // Dark brown/charcoal brick base
    wctx.fillStyle = '#1c1f24';
    wctx.fillRect(0, 0, 512, 512);

    // Brick mortar lines
    wctx.strokeStyle = '#121417';
    wctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 16) {
      wctx.beginPath();
      wctx.moveTo(0, y);
      wctx.lineTo(512, y);
      wctx.stroke();
    }

    // Window grid
    const cols = 8;
    const rows = 12;
    const winW = 32;
    const winH = 26;
    const stepX = 512 / cols;
    const stepY = 512 / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wx = c * stepX + 16;
        const wy = r * stepY + 8;

        // Window frame
        wctx.fillStyle = '#0a0b0e';
        wctx.fillRect(wx - 2, wy - 2, winW + 4, winH + 4);

        // Window glass with warm glow or dark room
        const isLit = (Math.sin(c * 13.5 + r * 7.2) > -0.2);
        if (isLit) {
          const warmL = 180 + Math.floor(Math.sin(c * 3 + r * 5) * 50);
          wctx.fillStyle = `rgb(${warmL + 30}, ${warmL - 10}, 100)`;
          wctx.fillRect(wx, wy, winW, winH);

          // Window panes / cross bars
          wctx.fillStyle = '#151515';
          wctx.fillRect(wx + winW / 2 - 1, wy, 2, winH);
          wctx.fillRect(wx, wy + winH / 2 - 1, winW, 2);

          // Blinds / curtains on some windows
          if (Math.sin(c * 8 + r * 3) > 0.3) {
            wctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
            wctx.fillRect(wx, wy, winW, winH * 0.4);
          }
        } else {
          wctx.fillStyle = '#101317';
          wctx.fillRect(wx, wy, winW, winH);
        }
      }
    }

    this.buildingTexture = new THREE.CanvasTexture(winCanvas);
    this.buildingTexture.wrapS = THREE.RepeatWrapping;
    this.buildingTexture.wrapT = THREE.RepeatWrapping;
    this.buildingTexture.repeat.set(2, 2);

    // 2. High-Detail Wet Asphalt Texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 256;
    roadCanvas.height = 256;
    const rctx = roadCanvas.getContext('2d');
    rctx.fillStyle = '#16181d';
    rctx.fillRect(0, 0, 256, 256);

    // Subtle road grain / pebbles
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const shade = 18 + Math.floor(Math.random() * 22);
      rctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
      rctx.fillRect(rx, ry, 2, 2);
    }
    this.roadTexture = new THREE.CanvasTexture(roadCanvas);
    this.roadTexture.wrapS = THREE.RepeatWrapping;
    this.roadTexture.wrapT = THREE.RepeatWrapping;
    this.roadTexture.repeat.set(16, 16);

    // 3. Sidewalk Paver Texture
    const swCanvas = document.createElement('canvas');
    swCanvas.width = 128;
    swCanvas.height = 128;
    const sctx = swCanvas.getContext('2d');
    sctx.fillStyle = '#343840';
    sctx.fillRect(0, 0, 128, 128);
    sctx.strokeStyle = '#22252a';
    sctx.lineWidth = 2;
    for (let i = 0; i < 128; i += 32) {
      sctx.strokeRect(i, 0, 32, 128);
      sctx.strokeRect(0, i, 128, 32);
    }
    this.sidewalkTexture = new THREE.CanvasTexture(swCanvas);
    this.sidewalkTexture.wrapS = THREE.RepeatWrapping;
    this.sidewalkTexture.wrapT = THREE.RepeatWrapping;
    this.sidewalkTexture.repeat.set(4, 4);

    // Materials
    this.roadMat = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      roughness: 0.35,
      metalness: 0.15
    });

    this.buildingMat = new THREE.MeshStandardMaterial({
      map: this.buildingTexture,
      roughness: 0.6,
      metalness: 0.1
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.sidewalkTexture,
      roughness: 0.8
    });
  }

  initCity() {
    this.createSkyAndMoon();
    this.createRoadsAndGround();
    this.createKeyLandmarks();
    this.createCityBuildings();
    this.createPlazaAndFountain();
    this.createStreetFurniture();
    this.spawnPedestrians();
    this.setupWorldBorders();
  }

  createSkyAndMoon() {
    // 1. Starfield in midnight sky
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15); // Above horizon
      const radius = 220;
      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.cos(phi);
      starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xeeffff, size: 1.2, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);

    // 2. Large Noir Full Moon with Soft Glow
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-60, 110, -110);

    const moonGeo = new THREE.CircleGeometry(16, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae8 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    // Moon Glow Halo
    const haloGeo = new THREE.CircleGeometry(26, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea99,
      transparent: true,
      opacity: 0.25
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.z = -0.5;
    moonGroup.add(haloMesh);

    moonGroup.lookAt(0, 0, 0);
    this.scene.add(moonGroup);
  }

  createRoadsAndGround() {
    // Main City Asphalt Ground (160m x 160m)
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, this.roadMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Sidewalk slabs
    const sidewalkBlocks = [
      { x: -35, z: 35, w: 46, d: 46 },
      { x: 35, z: 35, w: 46, d: 46 },
      { x: -35, z: -35, w: 46, d: 46 },
      { x: 35, z: -35, w: 46, d: 46 }
    ];

    sidewalkBlocks.forEach((blk) => {
      const geo = new THREE.BoxGeometry(blk.w, 0.22, blk.d);
      const mesh = new THREE.Mesh(geo, this.sidewalkMat);
      mesh.position.set(blk.x, 0.11, blk.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // Road Markings (White dashed lines & Crosswalks)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe0e0d0 });

    for (let z = -70; z <= 70; z += 6) {
      if (Math.abs(z) > 12) {
        const dashGeo = new THREE.PlaneGeometry(0.35, 3.2);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.015, z);
        this.scene.add(dash);
      }
    }

    for (let x = -70; x <= 70; x += 6) {
      if (Math.abs(x) > 12) {
        const dashGeo = new THREE.PlaneGeometry(3.2, 0.35);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.015, 0);
        this.scene.add(dash);
      }
    }

    // Crosswalk zebra stripes
    [-9.5, 9.5].forEach(pos => {
      for (let i = -6; i <= 6; i += 1.6) {
        const zGeo = new THREE.PlaneGeometry(0.8, 4.0);
        const zMesh = new THREE.Mesh(zGeo, lineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(i, 0.016, pos);
        this.scene.add(zMesh);
      }
      for (let i = -6; i <= 6; i += 1.6) {
        const zGeo = new THREE.PlaneGeometry(4.0, 0.8);
        const zMesh = new THREE.Mesh(zGeo, lineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(pos, 0.016, i);
        this.scene.add(zMesh);
      }
    });

    // Glossy Water Puddles with high specular reflections
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x05080c,
      roughness: 0.02,
      metalness: 0.95,
      transparent: true,
      opacity: 0.92
    });

    const puddlePositions = [
      { x: 3, z: 8, rx: 2.8, rz: 2.0 },
      { x: -5, z: -15, rx: 3.5, rz: 2.2 },
      { x: 18, z: 4, rx: 2.2, rz: 3.2 },
      { x: -22, z: 5, rx: 3.4, rz: 1.8 }
    ];

    puddlePositions.forEach(p => {
      const pGeo = new THREE.CircleGeometry(p.rx, 20);
      const pMesh = new THREE.Mesh(pGeo, puddleMat);
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.scale.set(1, p.rz / p.rx, 1);
      pMesh.position.set(p.x, 0.02, p.z);
      this.scene.add(pMesh);
    });
  }

  createKeyLandmarks() {
    // ---- 1. DE SANTA LOUNGE & JAZZ CLUB (NW: center x=-26, z=26) ----
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(-26, 0, 26);
    this.scene.add(loungeGroup);

    // Main Club Building (18w x 14h x 18d)
    const bGeo = new THREE.BoxGeometry(18, 14, 18);
    const bMesh = new THREE.Mesh(bGeo, this.buildingMat);
    bMesh.position.set(0, 7, 0);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    loungeGroup.add(bMesh);

    // Register Lounge Collider
    this.addBoxCollider(-26, 26, 18.5, 18.5);

    // Art Deco Velvet Canopy
    const canopyGeo = new THREE.BoxGeometry(8, 0.8, 4.5);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x991818, roughness: 0.3 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.2, 9.5);
    canopy.castShadow = true;
    loungeGroup.add(canopy);

    // Canopy Pillar Colliders
    this.addCircleCollider(-26 - 3.8, 26 + 11.5, 0.4);
    this.addCircleCollider(-26 + 3.8, 26 + 11.5, 0.4);

    // Glowing Neon Sign: "DE SANTA LOUNGE"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#0a0a0e';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#d4af37';
    sctx.lineWidth = 6;
    sctx.strokeRect(8, 8, 496, 112);

    sctx.fillStyle = '#ffcc00';
    sctx.font = 'bold 36px Georgia, serif';
    sctx.textAlign = 'center';
    sctx.shadowColor = '#f39c12';
    sctx.shadowBlur = 18;
    sctx.fillText('DE SANTA LOUNGE', 256, 55);
    sctx.font = 'italic 20px Georgia, serif';
    sctx.fillStyle = '#f5e6b3';
    sctx.fillText('★ Calme & Sérieux • Jazz Club ★', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signGeo = new THREE.PlaneGeometry(7.2, 1.8);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 5.8, 9.6);
    loungeGroup.add(signMesh);
    this.neonSigns.push(signMesh);

    // Warm Gold Lounge Spotlight
    const clubLight = new THREE.PointLight(0xffaa33, 3.2, 22);
    clubLight.position.set(0, 4.2, 11.5);
    loungeGroup.add(clubLight);

    // Red carpet
    const carpetGeo = new THREE.PlaneGeometry(2.4, 6.0);
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.23, 11.2);
    loungeGroup.add(carpet);

    // ---- 2. SANTA TRUST BANK (NE: center x=26, z=26) ----
    const bankGroup = new THREE.Group();
    bankGroup.position.set(26, 0, 26);
    this.scene.add(bankGroup);

    // Bank Main Building (20w x 18h x 20d)
    const bankBldGeo = new THREE.BoxGeometry(20, 18, 20);
    const bankBld = new THREE.Mesh(bankBldGeo, this.buildingMat);
    bankBld.position.set(0, 9, 0);
    bankBld.castShadow = true;
    bankGroup.add(bankBld);

    // Register Bank Collider
    this.addBoxCollider(26, 26, 20.5, 20.5);

    // Neoclassical Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cd, roughness: 0.35, metalness: 0.1 });
    const colOffsets = [-7, -3.5, 0, 3.5, 7];
    colOffsets.forEach(x => {
      const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 9.5, 16);
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 4.8, 10.5);
      col.castShadow = true;
      bankGroup.add(col);
      this.addCircleCollider(26 + x, 26 + 10.5, 0.65);
    });

    // Bank Pediment
    const pedGeo = new THREE.ConeGeometry(9.5, 3.5, 4);
    const ped = new THREE.Mesh(pedGeo, colMat);
    ped.position.set(0, 11.5, 10.5);
    ped.rotation.y = Math.PI / 4;
    bankGroup.add(ped);

    // Bank Sign: "SANTA TRUST BANK"
    const bankCanvas = document.createElement('canvas');
    bankCanvas.width = 512;
    bankCanvas.height = 96;
    const bctx = bankCanvas.getContext('2d');
    bctx.fillStyle = '#1c2228';
    bctx.fillRect(0, 0, 512, 96);
    bctx.strokeStyle = '#c9a84d';
    bctx.lineWidth = 4;
    bctx.strokeRect(6, 6, 500, 84);
    bctx.fillStyle = '#e8d28a';
    bctx.font = 'bold 32px Georgia, serif';
    bctx.textAlign = 'center';
    bctx.fillText('SANTA TRUST BANK', 256, 58);

    const bankSignTex = new THREE.CanvasTexture(bankCanvas);
    const bankSignMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.2), new THREE.MeshBasicMaterial({ map: bankSignTex }));
    bankSignMesh.position.set(0, 9.8, 10.8);
    bankGroup.add(bankSignMesh);

    // ---- 3. GRAND AUDITORIUM (SW: center x=-26, z=-26) ----
    const audiGroup = new THREE.Group();
    audiGroup.position.set(-26, 0, -26);
    this.scene.add(audiGroup);

    // Auditorium Building (22w x 16h x 22d)
    const audiGeo = new THREE.BoxGeometry(22, 16, 22);
    const audi = new THREE.Mesh(audiGeo, this.buildingMat);
    audi.position.set(0, 8, 0);
    audi.castShadow = true;
    audiGroup.add(audi);

    // Register Auditorium Collider
    this.addBoxCollider(-26, -26, 22.5, 22.5);

    // Presentation Marquee Sign
    const audiCanvas = document.createElement('canvas');
    audiCanvas.width = 512;
    audiCanvas.height = 128;
    const actx = audiCanvas.getContext('2d');
    actx.fillStyle = '#0f1115';
    actx.fillRect(0, 0, 512, 128);
    actx.strokeStyle = '#f1c40f';
    actx.lineWidth = 5;
    actx.strokeRect(6, 6, 500, 116);
    actx.fillStyle = '#f1c40f';
    actx.font = 'bold 30px Georgia, serif';
    actx.textAlign = 'center';
    actx.fillText('GRAND AUDITORIUM', 256, 48);
    actx.fillStyle = '#fff';
    actx.font = 'bold 22px Georgia, serif';
    actx.fillText('ORAL PRESENTATION: MICHELLE', 256, 85);
    actx.fillStyle = '#baa785';
    actx.font = 'italic 16px Georgia, serif';
    actx.fillText('"A True Friend in Any Situation"', 256, 112);

    const audiTex = new THREE.CanvasTexture(audiCanvas);
    const audiSign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.1), new THREE.MeshBasicMaterial({ map: audiTex }));
    audiSign.position.set(0, 6.5, 11.2);
    audiGroup.add(audiSign);
    this.neonSigns.push(audiSign);

    // Stage Platform
    const stageGeo = new THREE.BoxGeometry(8, 0.8, 5);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.5 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.4, 13.5);
    audiGroup.add(stage);

    // Podium on stage
    const podiumGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x221710, roughness: 0.4 });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, 1.4, 13.5);
    audiGroup.add(podium);

    // ---- 4. TAILOR & BAKER SHOPS (SE: center x=26, z=-26) ----
    const shopGroup = new THREE.Group();
    shopGroup.position.set(26, 0, -26);
    this.scene.add(shopGroup);

    const shopGeo = new THREE.BoxGeometry(20, 14, 20);
    const shop = new THREE.Mesh(shopGeo, this.buildingMat);
    shop.position.set(0, 7, 0);
    shopGroup.add(shop);

    // Register Shop Collider
    this.addBoxCollider(26, -26, 20.5, 20.5);

    // Tailor Shop Awning
    const awningGeo = new THREE.BoxGeometry(6, 0.5, 3.2);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0x1d3f5e });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(-4.5, 3.8, 10.5);
    shopGroup.add(awning);

    // Baker Shop Awning
    const bAwningMat = new THREE.MeshStandardMaterial({ color: 0xa8422b });
    const bAwning = new THREE.Mesh(awningGeo, bAwningMat);
    bAwning.position.set(4.5, 3.8, 10.5);
    shopGroup.add(bAwning);
  }

  createCityBuildings() {
    // Perimeter Skyline Buildings
    const bldPositions = [
      // North skyline
      { x: -55, z: 50, w: 16, h: 26, d: 16 },
      { x: -35, z: 55, w: 16, h: 32, d: 16 },
      { x: 35, z: 55, w: 16, h: 28, d: 16 },
      { x: 55, z: 50, w: 16, h: 34, d: 16 },

      // South skyline
      { x: -55, z: -50, w: 16, h: 24, d: 16 },
      { x: -35, z: -55, w: 16, h: 36, d: 16 },
      { x: 35, z: -55, w: 16, h: 30, d: 16 },
      { x: 55, z: -50, w: 16, h: 22, d: 16 },

      // West & East edge towers
      { x: -58, z: 0, w: 16, h: 38, d: 24 },
      { x: 58, z: 0, w: 16, h: 42, d: 24 }
    ];

    bldPositions.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, this.buildingMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Register building collider!
      this.addBoxCollider(b.x, b.z, b.w + 0.5, b.d + 0.5);
    });
  }

  createPlazaAndFountain() {
    // Grand Fountain in Central Plaza (offset x=-7, z=7)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(-7, 0, 7);
    this.scene.add(fountainGroup);

    // Stone Basin
    const basinGeo = new THREE.CylinderGeometry(3.6, 3.9, 0.75, 24);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.5 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.375;
    basin.castShadow = true;
    fountainGroup.add(basin);

    // Register Fountain Cylinder Collider!
    this.addCircleCollider(-7, 7, 3.9);

    // Water Surface
    const waterGeo = new THREE.CircleGeometry(3.4, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x225577,
      roughness: 0.05,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.68;
    fountainGroup.add(water);

    // Central Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.65, 0.85, 2.2, 16);
    const ped = new THREE.Mesh(pedGeo, basinMat);
    ped.position.y = 1.4;
    fountainGroup.add(ped);

    const bowlGeo = new THREE.CylinderGeometry(1.6, 0.8, 0.55, 18);
    const bowl = new THREE.Mesh(bowlGeo, basinMat);
    bowl.position.y = 2.4;
    fountainGroup.add(bowl);

    // Splashing Water Particles
    const pCount = 45;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 1.8;
      pPos[i * 3 + 1] = 2.5 + Math.random() * 1.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xcceeff,
      size: 0.16,
      transparent: true,
      opacity: 0.75
    });
    this.fountainParticles = new THREE.Points(pGeo, pMat);
    fountainGroup.add(this.fountainParticles);

    // Plaza Benches
    this.createParkBench(-11, 0.22, 7, 0);
    this.createParkBench(-7, 0.22, 11, Math.PI / 2);
    this.addBoxCollider(-11, 7, 2.2, 0.8);
    this.addBoxCollider(-7, 11, 0.8, 2.2);

    // Plaza Trees
    this.createPlazaTree(-11, 0.22, 11);
    this.addCircleCollider(-11, 11, 0.6);
  }

  createParkBench(x, y, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rot;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2e });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), woodMat);
    seat.position.y = 0.45;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.08), woodMat);
    back.position.set(0, 0.75, -0.22);
    group.add(back);

    this.scene.add(group);
  }

  createPlazaTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x243e24, roughness: 0.8 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 4.5), trunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 10), leavesMat);
    leaves.position.y = 4.8;
    leaves.scale.set(1, 1.3, 1);
    leaves.castShadow = true;
    group.add(leaves);

    this.scene.add(group);
  }

  createStreetFurniture() {
    const lampPositions = [
      { x: -11.5, z: 12 },
      { x: -11.5, z: -12 },
      { x: 11.5, z: 12 },
      { x: 11.5, z: -12 },
      { x: -11.5, z: 28 },
      { x: 11.5, z: 28 },
      { x: -11.5, z: -28 },
      { x: 11.5, z: -28 }
    ];

    lampPositions.forEach((lp) => {
      this.createStreetLamp(lp.x, lp.z);
      this.addCircleCollider(lp.x, lp.z, 0.35);
    });

    this.createHydrant(-11.5, 0.22, 16);
    this.addCircleCollider(-11.5, 16, 0.3);

    this.createHydrant(11.5, 0.22, -16);
    this.addCircleCollider(11.5, -16, 0.3);
  }

  createStreetLamp(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.22, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.85, roughness: 0.2 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 4.8, 12), metalMat);
    post.position.y = 2.4;
    post.castShadow = true;
    group.add(post);

    // Lantern fixture
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffe699 });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.5, 8), lanternMat);
    lantern.position.y = 4.9;
    group.add(lantern);

    // Warm street light
    const light = new THREE.PointLight(0xffd677, 2.2, 16);
    light.position.set(0, 4.9, 0);
    group.add(light);

    // ---- VOLUMETRIC LIGHT CONE SHAFT (Next-Gen Noir Atmosphere) ----
    const coneGeo = new THREE.CylinderGeometry(0.22, 2.8, 4.8, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffd888,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 2.4;
    group.add(cone);
    this.volumetricCones.push(cone);

    this.scene.add(group);
  }

  createHydrant(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const hMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65), hMat);
    body.position.y = 0.325;
    group.add(body);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), hMat);
    cap.position.y = 0.65;
    group.add(cap);

    this.scene.add(group);
  }

  spawnPedestrians() {
    const pedestrianConfigs = [
      { name: "Tommy (Friend)", x: 28, z: 8, color: 0x3d4b68, hat: false, isTommy: true },
      { name: "Luigi (Baker)", x: 24, z: -18, color: 0x883322, hat: false, isBaker: true },
      { name: "Sophia (Tailor)", x: 18, z: -18, color: 0x5a3377, hat: false, isTailor: true },
      { name: "Officer Davis", x: -8, z: -15, color: 0x1c2b48, hat: true, isCop: true },
      { name: "Thug Frankie", x: 30, z: 10, color: 0x222222, hat: true, isThug: true },
      { name: "Thug Sal", x: 29, z: 6, color: 0x2d2d2d, hat: true, isThug: true }
    ];

    pedestrianConfigs.forEach(cfg => {
      const ped = this.createPedestrianMesh(cfg);
      this.pedestrians.push(ped);
    });
  }

  createPedestrianMesh(cfg) {
    const group = new THREE.Group();
    group.position.set(cfg.x, 0.22, cfg.z);
    group.userData = cfg;

    const coatMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfaa88 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.25), coatMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
    head.position.y = 1.55;
    group.add(head);

    if (cfg.hat) {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.12, 12), hatMat);
      hat.position.y = 1.72;
      group.add(hat);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = cfg.isThug ? 'rgba(180, 40, 40, 0.85)' : 'rgba(20, 24, 30, 0.85)';
    ctx.roundRect ? ctx.roundRect(4, 4, 172, 40, 8) : ctx.rect(4, 4, 172, 40);
    ctx.fill();
    ctx.strokeStyle = cfg.isThug ? '#ff4444' : '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.name, 90, 28);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.4, 0.38, 1);
    sprite.position.y = 2.1;
    group.add(sprite);

    this.scene.add(group);
    return group;
  }

  setupWorldBorders() {
    // City bounds: [-72, 72] on X and Z
    const maxBound = 72;
    this.colliders.push({ type: 'wall_x', val: -maxBound, side: 1 });  // px must be >= -72
    this.colliders.push({ type: 'wall_x', val: maxBound, side: -1 });  // px must be <= 72
    this.colliders.push({ type: 'wall_z', val: -maxBound, side: 1 });  // pz must be >= -72
    this.colliders.push({ type: 'wall_z', val: maxBound, side: -1 });  // pz must be <= 72
  }

  addBoxCollider(centerX, centerZ, width, depth) {
    const halfW = width / 2;
    const halfD = depth / 2;
    this.colliders.push({
      type: 'box',
      minX: centerX - halfW,
      maxX: centerX + halfW,
      minZ: centerZ - halfD,
      maxZ: centerZ + halfD
    });
  }

  addCircleCollider(x, z, radius) {
    this.colliders.push({
      type: 'circle',
      x: x,
      z: z,
      r: radius
    });
  }

  /**
   * Resolves collision for a spherical/cylinder actor (player, car)
   * Returns corrected { x, z, collided }
   */
  resolveCollision(posX, posZ, radius) {
    let x = posX;
    let z = posZ;
    let hasCollided = false;

    // Run 2 iterations for clean corner resolution
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i];

        if (c.type === 'box') {
          // Closest point on box
          const closeX = Math.max(c.minX, Math.min(x, c.maxX));
          const closeZ = Math.max(c.minZ, Math.min(z, c.maxZ));

          const dx = x - closeX;
          const dz = z - closeZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < radius * radius) {
            hasCollided = true;
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const pen = radius - dist;
              x += (dx / dist) * pen;
              z += (dz / dist) * pen;
            } else {
              // Deep inside: push out along nearest edge
              const dMinX = Math.abs(x - c.minX);
              const dMaxX = Math.abs(x - c.maxX);
              const dMinZ = Math.abs(z - c.minZ);
              const dMaxZ = Math.abs(z - c.maxZ);
              const minPen = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);
              if (minPen === dMinX) x = c.minX - radius;
              else if (minPen === dMaxX) x = c.maxX + radius;
              else if (minPen === dMinZ) z = c.minZ - radius;
              else z = c.maxZ + radius;
            }
          }
        }
        else if (c.type === 'circle') {
          const dx = x - c.x;
          const dz = z - c.z;
          const distSq = dx * dx + dz * dz;
          const minDist = radius + c.r;

          if (distSq < minDist * minDist) {
            hasCollided = true;
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const pen = minDist - dist;
              x += (dx / dist) * pen;
              z += (dz / dist) * pen;
            } else {
              x += minDist;
            }
          }
        }
        else if (c.type === 'wall_x') {
          if (c.side === 1 && x < c.val + radius) {
            x = c.val + radius;
            hasCollided = true;
          } else if (c.side === -1 && x > c.val - radius) {
            x = c.val - radius;
            hasCollided = true;
          }
        }
        else if (c.type === 'wall_z') {
          if (c.side === 1 && z < c.val + radius) {
            z = c.val + radius;
            hasCollided = true;
          } else if (c.side === -1 && z > c.val - radius) {
            z = c.val - radius;
            hasCollided = true;
          }
        }
      }
    }

    return { x, z, collided: hasCollided };
  }

  update(dt) {
    // Animate fountain particles
    if (this.fountainParticles) {
      const pos = this.fountainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += Math.sin(Date.now() * 0.005 + i) * 0.015;
      }
      this.fountainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Subtle neon flicker
    this.neonSigns.forEach(sign => {
      if (Math.random() > 0.985) {
        sign.visible = false;
        setTimeout(() => { sign.visible = true; }, 50);
      }
    });
  }
}

window.CityWorld = CityWorld;

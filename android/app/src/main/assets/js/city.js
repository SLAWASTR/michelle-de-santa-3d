/**
 * Michelle De Santa 3D - Liberty City District (GTA 3 Visual Style)
 * Authentic 2000s 3D aesthetics:
 * - Slate-blue Portland fog, yellow cabs, weathered brick tenements
 * - Neon signs in hot pink & cyan, sewer grates, crosswalks
 * - Safe, crash-proof collision system.
 */

class CityWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.pedestrians = [];
    this.volumetricCones = [];
    this.neonSigns = [];

    this.generateProceduralTextures();
    this.initCity();
  }

  generateProceduralTextures() {
    // 1. GTA 3 Style Red/Brown Brick & Illuminated Windows
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 512;
    winCanvas.height = 512;
    const wctx = winCanvas.getContext('2d');

    // Weathered Liberty City brick
    wctx.fillStyle = '#221919';
    wctx.fillRect(0, 0, 512, 512);

    // Brick mortar lines
    wctx.strokeStyle = '#140f0f';
    wctx.lineWidth = 1.5;
    for (let y = 0; y < 512; y += 16) {
      wctx.beginPath();
      wctx.moveTo(0, y);
      wctx.lineTo(512, y);
      wctx.stroke();
    }

    // Windows with green copper frames (classic GTA 3 aesthetic)
    const cols = 8;
    const rows = 10;
    const winW = 34;
    const winH = 28;
    const stepX = 512 / cols;
    const stepY = 512 / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wx = c * stepX + 15;
        const wy = r * stepY + 12;

        // Copper green window frame
        wctx.fillStyle = '#1c2e26';
        wctx.fillRect(wx - 2, wy - 2, winW + 4, winH + 4);

        const isLit = (Math.sin(c * 11.2 + r * 5.7) > -0.15);
        if (isLit) {
          const warm = 190 + Math.floor(Math.sin(c * 4 + r * 6) * 45);
          wctx.fillStyle = `rgb(${warm + 30}, ${warm - 10}, 110)`;
          wctx.fillRect(wx, wy, winW, winH);

          wctx.fillStyle = '#181818';
          wctx.fillRect(wx + winW / 2 - 1, wy, 2, winH);
          wctx.fillRect(wx, wy + winH / 2 - 1, winW, 2);
        } else {
          wctx.fillStyle = '#101316';
          wctx.fillRect(wx, wy, winW, winH);
        }
      }
    }

    this.buildingTexture = new THREE.CanvasTexture(winCanvas);
    this.buildingTexture.wrapS = THREE.RepeatWrapping;
    this.buildingTexture.wrapT = THREE.RepeatWrapping;
    this.buildingTexture.repeat.set(2, 2);

    // 2. GTA 3 Weathered Asphalt Texture with Double Yellow Lines
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 256;
    roadCanvas.height = 256;
    const rctx = roadCanvas.getContext('2d');
    rctx.fillStyle = '#1d2128';
    rctx.fillRect(0, 0, 256, 256);

    // Asphalt noise grain
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const c = 22 + Math.floor(Math.random() * 25);
      rctx.fillStyle = `rgb(${c},${c+2},${c+4})`;
      rctx.fillRect(rx, ry, 2, 2);
    }
    this.roadTexture = new THREE.CanvasTexture(roadCanvas);
    this.roadTexture.wrapS = THREE.RepeatWrapping;
    this.roadTexture.wrapT = THREE.RepeatWrapping;
    this.roadTexture.repeat.set(16, 16);

    // 3. Sidewalk Concrete Slabs
    const swCanvas = document.createElement('canvas');
    swCanvas.width = 128;
    swCanvas.height = 128;
    const sctx = swCanvas.getContext('2d');
    sctx.fillStyle = '#3c424a';
    sctx.fillRect(0, 0, 128, 128);
    sctx.strokeStyle = '#282d33';
    sctx.lineWidth = 2;
    for (let i = 0; i < 128; i += 32) {
      sctx.strokeRect(i, 0, 32, 128);
      sctx.strokeRect(0, i, 128, 32);
    }
    this.sidewalkTexture = new THREE.CanvasTexture(swCanvas);
    this.sidewalkTexture.wrapS = THREE.RepeatWrapping;
    this.sidewalkTexture.wrapT = THREE.RepeatWrapping;
    this.sidewalkTexture.repeat.set(4, 4);

    this.roadMat = new THREE.MeshStandardMaterial({ map: this.roadTexture, roughness: 0.45, metalness: 0.1 });
    this.buildingMat = new THREE.MeshStandardMaterial({ map: this.buildingTexture, roughness: 0.65, metalness: 0.08 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({ map: this.sidewalkTexture, roughness: 0.8 });
  }

  initCity() {
    this.createSkyAndMoon();
    this.createRoadsAndGround();
    this.createKeyLandmarks();
    this.createCityBuildings();
    this.createPlazaAndFountain();
    this.createStreetFurniture();
    this.spawnParkedCabs();
    this.spawnPedestrians();
    this.setupWorldBorders();
  }

  createSkyAndMoon() {
    // GTA 3 Classic Starry Sky
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15);
      const radius = 220;
      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.cos(phi);
      starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xddeeff, size: 1.2, transparent: true, opacity: 0.85 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // Liberty City Moon
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-60, 110, -110);
    const moonMesh = new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: 0xfffae8 }));
    moonGroup.add(moonMesh);

    const haloMesh = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: 0xffea99, transparent: true, opacity: 0.22 }));
    haloMesh.position.z = -0.5;
    moonGroup.add(haloMesh);

    moonGroup.lookAt(0, 0, 0);
    this.scene.add(moonGroup);
  }

  createRoadsAndGround() {
    // Main Asphalt Surface
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, this.roadMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Concrete Sidewalk Blocks
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

    // Double Yellow Center Lines (Iconic GTA 3 style)
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe0e0d0 });

    // North-South Avenue Double Yellow Line
    for (let z = -70; z <= 70; z += 5) {
      if (Math.abs(z) > 12) {
        [-0.2, 0.2].forEach(ox => {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.4), yellowLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(ox, 0.016, z);
          this.scene.add(dash);
        });
      }
    }

    // East-West Street Center Line
    for (let x = -70; x <= 70; x += 5) {
      if (Math.abs(x) > 12) {
        [-0.2, 0.2].forEach(oz => {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.18), yellowLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.016, oz);
          this.scene.add(dash);
        });
      }
    }

    // Crosswalk zebra stripes
    [-9.5, 9.5].forEach(pos => {
      for (let i = -6; i <= 6; i += 1.6) {
        const zMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.0), whiteLineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(i, 0.016, pos);
        this.scene.add(zMesh);
      }
      for (let i = -6; i <= 6; i += 1.6) {
        const zMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.8), whiteLineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(pos, 0.016, i);
        this.scene.add(zMesh);
      }
    });

    // Sewer drainage grates at curbs (Classic GTA 3 touch!)
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
    const gratePositions = [
      { x: -11.2, z: 8 }, { x: -11.2, z: -8 },
      { x: 11.2, z: 8 }, { x: 11.2, z: -8 }
    ];
    gratePositions.forEach(gp => {
      const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), grateMat);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(gp.x, 0.02, gp.z);
      this.scene.add(grate);
    });
  }

  createKeyLandmarks() {
    // ---- 1. DE SANTA LOUNGE (NW: center x=-26, z=26) ----
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(-26, 0, 26);
    this.scene.add(loungeGroup);

    const bGeo = new THREE.BoxGeometry(18, 14, 18);
    const bMesh = new THREE.Mesh(bGeo, this.buildingMat);
    bMesh.position.set(0, 7, 0);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    loungeGroup.add(bMesh);

    this.addBoxCollider(-26, 26, 18.5, 18.5);

    // GTA 3 Neon Style Marquee (Hot Pink & Electric Gold)
    const canopyGeo = new THREE.BoxGeometry(8, 0.8, 4.5);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x881133, roughness: 0.3 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.2, 9.5);
    canopy.castShadow = true;
    loungeGroup.add(canopy);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#08080c';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#ff0066'; // Hot pink neon
    sctx.lineWidth = 6;
    sctx.strokeRect(8, 8, 496, 112);

    sctx.fillStyle = '#ff0066';
    sctx.font = 'bold 38px Impact, -apple-system, sans-serif';
    sctx.textAlign = 'center';
    sctx.shadowColor = '#ff0066';
    sctx.shadowBlur = 18;
    sctx.fillText('DE SANTA LOUNGE', 256, 55);

    sctx.font = 'bold 20px -apple-system, sans-serif';
    sctx.fillStyle = '#00ffff'; // Electric cyan
    sctx.shadowColor = '#00ffff';
    sctx.fillText('★ CALME & SÉRIEUX • MAFIA CLUB ★', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ map: signTex }));
    signMesh.position.set(0, 5.8, 9.6);
    loungeGroup.add(signMesh);
    this.neonSigns.push(signMesh);

    const clubLight = new THREE.PointLight(0xff0066, 3.5, 22);
    clubLight.position.set(0, 4.2, 11.5);
    loungeGroup.add(clubLight);

    // ---- 2. SANTA TRUST BANK (NE: center x=26, z=26) ----
    const bankGroup = new THREE.Group();
    bankGroup.position.set(26, 0, 26);
    this.scene.add(bankGroup);

    const bankBld = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 20), this.buildingMat);
    bankBld.position.set(0, 9, 0);
    bankBld.castShadow = true;
    bankGroup.add(bankBld);
    this.addBoxCollider(26, 26, 20.5, 20.5);

    const colMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cd, roughness: 0.35, metalness: 0.1 });
    const colOffsets = [-7, -3.5, 0, 3.5, 7];
    colOffsets.forEach(x => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.5, 16), colMat);
      col.position.set(x, 4.8, 10.5);
      col.castShadow = true;
      bankGroup.add(col);
      this.addCircleCollider(26 + x, 26 + 10.5, 0.65);
    });

    const ped = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.5, 4), colMat);
    ped.position.set(0, 11.5, 10.5);
    ped.rotation.y = Math.PI / 4;
    bankGroup.add(ped);

    const bankCanvas = document.createElement('canvas');
    bankCanvas.width = 512;
    bankCanvas.height = 96;
    const bctx = bankCanvas.getContext('2d');
    bctx.fillStyle = '#1c2228';
    bctx.fillRect(0, 0, 512, 96);
    bctx.strokeStyle = '#c9a84d';
    bctx.lineWidth = 4;
    bctx.strokeRect(6, 6, 500, 84);
    bctx.fillStyle = '#f1c40f';
    bctx.font = 'bold 32px Impact, sans-serif';
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

    const audi = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 22), this.buildingMat);
    audi.position.set(0, 8, 0);
    audi.castShadow = true;
    audiGroup.add(audi);
    this.addBoxCollider(-26, -26, 22.5, 22.5);

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
    actx.font = 'bold 30px Impact, sans-serif';
    actx.textAlign = 'center';
    actx.fillText('GRAND AUDITORIUM', 256, 48);
    actx.fillStyle = '#fff';
    actx.font = 'bold 22px Arial, sans-serif';
    actx.fillText('ORAL PRESENTATION: MICHELLE', 256, 85);

    const audiSign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(audiCanvas) }));
    audiSign.position.set(0, 6.5, 11.2);
    audiGroup.add(audiSign);
    this.neonSigns.push(audiSign);

    // Stage
    const stage = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 5), new THREE.MeshStandardMaterial({ color: 0x5a3d28 }));
    stage.position.set(0, 0.4, 13.5);
    audiGroup.add(stage);

    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x221710 }));
    podium.position.set(0, 1.4, 13.5);
    audiGroup.add(podium);

    // ---- 4. TAILOR & BAKER SHOPS (SE: center x=26, z=-26) ----
    const shopGroup = new THREE.Group();
    shopGroup.position.set(26, 0, -26);
    this.scene.add(shopGroup);

    const shop = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 20), this.buildingMat);
    shop.position.set(0, 7, 0);
    shopGroup.add(shop);
    this.addBoxCollider(26, -26, 20.5, 20.5);

    const awningL = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3.2), new THREE.MeshStandardMaterial({ color: 0x1d3f5e }));
    awningL.position.set(-4.5, 3.8, 10.5);
    shopGroup.add(awningL);

    const awningR = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3.2), new THREE.MeshStandardMaterial({ color: 0xa8422b }));
    awningR.position.set(4.5, 3.8, 10.5);
    shopGroup.add(awningR);
  }

  createCityBuildings() {
    const bldPositions = [
      { x: -55, z: 50, w: 16, h: 26, d: 16 },
      { x: -35, z: 55, w: 16, h: 32, d: 16 },
      { x: 35, z: 55, w: 16, h: 28, d: 16 },
      { x: 55, z: 50, w: 16, h: 34, d: 16 },
      { x: -55, z: -50, w: 16, h: 24, d: 16 },
      { x: -35, z: -55, w: 16, h: 36, d: 16 },
      { x: 35, z: -55, w: 16, h: 30, d: 16 },
      { x: 55, z: -50, w: 16, h: 22, d: 16 },
      { x: -58, z: 0, w: 16, h: 38, d: 24 },
      { x: 58, z: 0, w: 16, h: 42, d: 24 }
    ];

    bldPositions.forEach((b) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.buildingMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.addBoxCollider(b.x, b.z, b.w + 0.5, b.d + 0.5);
    });
  }

  createPlazaAndFountain() {
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(-7, 0, 7);
    this.scene.add(fountainGroup);

    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.75, 24), new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.5 }));
    basin.position.y = 0.375;
    basin.castShadow = true;
    fountainGroup.add(basin);
    this.addCircleCollider(-7, 7, 3.9);

    const water = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), new THREE.MeshStandardMaterial({ color: 0x225577, roughness: 0.05, metalness: 0.85, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.68;
    fountainGroup.add(water);

    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.2, 16), new THREE.MeshStandardMaterial({ color: 0x4a4e54 }));
    ped.position.y = 1.4;
    fountainGroup.add(ped);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.8, 0.55, 18), new THREE.MeshStandardMaterial({ color: 0x4a4e54 }));
    bowl.position.y = 2.4;
    fountainGroup.add(bowl);

    // Plaza Benches & Trees
    this.createParkBench(-11, 0.22, 7, 0);
    this.createParkBench(-7, 0.22, 11, Math.PI / 2);
    this.addBoxCollider(-11, 7, 2.2, 0.8);
    this.addBoxCollider(-7, 11, 0.8, 2.2);

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

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 4.5), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 10), new THREE.MeshStandardMaterial({ color: 0x243e24 }));
    leaves.position.y = 4.8;
    leaves.scale.set(1, 1.3, 1);
    leaves.castShadow = true;
    group.add(leaves);

    this.scene.add(group);
  }

  createStreetFurniture() {
    const lampPositions = [
      { x: -11.5, z: 12 }, { x: -11.5, z: -12 },
      { x: 11.5, z: 12 }, { x: 11.5, z: -12 },
      { x: -11.5, z: 28 }, { x: 11.5, z: 28 },
      { x: -11.5, z: -28 }, { x: 11.5, z: -28 }
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

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 4.8, 12), new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.85 }));
    post.position.y = 2.4;
    post.castShadow = true;
    group.add(post);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffe699 }));
    lantern.position.y = 4.9;
    group.add(lantern);

    const light = new THREE.PointLight(0xffd677, 2.2, 16);
    light.position.set(0, 4.9, 0);
    group.add(light);

    // Volumetric Cone
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 2.8, 4.8, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd888, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    cone.position.y = 2.4;
    group.add(cone);

    this.scene.add(group);
  }

  createHydrant(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65), new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.4 }));
    body.position.y = 0.325;
    group.add(body);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xaa2222 }));
    cap.position.y = 0.65;
    group.add(cap);
    this.scene.add(group);
  }

  spawnParkedCabs() {
    // Iconic GTA 3 Yellow Cabbies parked along sidewalks
    const cabConfigs = [
      { x: -14, z: -18, rot: 0 },
      { x: 14, z: 22, rot: Math.PI }
    ];

    cabConfigs.forEach(cfg => {
      this.createTaxiMesh(cfg.x, cfg.z, cfg.rot);
      this.addBoxCollider(cfg.x, cfg.z, 2.2, 4.5);
    });
  }

  createTaxiMesh(x, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rot;

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.3, metalness: 0.2 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.7 });

    // Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 4.2), yellowMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Roof & Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.2), yellowMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Windows
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.45, 2.0), glassMat);
    win.position.set(0, 1.15, -0.2);
    group.add(win);

    // Taxi Roof Sign ("TAXI")
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sign.position.set(0, 1.55, -0.2);
    group.add(sign);

    // Wheels
    for (let wx of [-0.9, 0.9]) {
      for (let wz of [-1.3, 1.3]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16), blackMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.35, wz);
        group.add(wheel);
      }
    }

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
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
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

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
    sprite.scale.set(1.4, 0.38, 1);
    sprite.position.y = 2.1;
    group.add(sprite);

    this.scene.add(group);
    return group;
  }

  setupWorldBorders() {
    const maxBound = 72;
    this.colliders.push({ type: 'wall_x', val: -maxBound, side: 1 });
    this.colliders.push({ type: 'wall_x', val: maxBound, side: -1 });
    this.colliders.push({ type: 'wall_z', val: -maxBound, side: 1 });
    this.colliders.push({ type: 'wall_z', val: maxBound, side: -1 });
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

  resolveCollision(posX, posZ, radius) {
    if (!isFinite(posX) || !isFinite(posZ)) {
      return { x: 0, z: 0, collided: false };
    }

    let x = posX;
    let z = posZ;
    let hasCollided = false;

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i];

        if (c.type === 'box') {
          const closeX = Math.max(c.minX, Math.min(x, c.maxX));
          const closeZ = Math.max(c.minZ, Math.min(z, c.maxZ));

          const dx = x - closeX;
          const dz = z - closeZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < radius * radius) {
            hasCollided = true;
            const dist = Math.sqrt(distSq);
            if (dist > 0.001) {
              const pen = radius - dist;
              x += (dx / dist) * pen;
              z += (dz / dist) * pen;
            } else {
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
            if (dist > 0.001) {
              const pen = minDist - dist;
              x += (dx / dist) * pen;
              z += (dz / dist) * pen;
            } else {
              x += minDist;
            }
          }
        }
        else if (c.type === 'wall_x') {
          if (c.side === 1 && x < c.val + radius) { x = c.val + radius; hasCollided = true; }
          else if (c.side === -1 && x > c.val - radius) { x = c.val - radius; hasCollided = true; }
        }
        else if (c.type === 'wall_z') {
          if (c.side === 1 && z < c.val + radius) { z = c.val + radius; hasCollided = true; }
          else if (c.side === -1 && z > c.val - radius) { z = c.val - radius; hasCollided = true; }
        }
      }
    }

    return { x, z, collided: hasCollided };
  }

  update(dt) {
    this.neonSigns.forEach(sign => {
      if (Math.random() > 0.985) {
        sign.visible = false;
        setTimeout(() => { sign.visible = true; }, 50);
      }
    });
  }
}

window.CityWorld = CityWorld;

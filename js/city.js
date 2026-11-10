/**
 * Michelle De Santa 3D - City Environment ("Santa District")
 * Art Deco noir architecture, neon signs, cobblestone/asphalt streets,
 * De Santa Lounge, Santa Trust Bank, Central Plaza Fountain, and NPCs.
 */

class CityWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.pedestrians = [];
    this.lights = [];

    this.initCity();
  }

  initCity() {
    this.createRoadsAndGround();
    this.createKeyLandmarks();
    this.createCityBuildings();
    this.createPlazaAndFountain();
    this.createStreetFurniture();
    this.spawnPedestrians();
  }

  createRoadsAndGround() {
    // 1. Main City Asphalt Ground (160m x 160m)
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f, // Wet dark asphalt
      roughness: 0.35,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Sidewalks & Curbstones (raised slabs around blocks)
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.8
    });

    const sidewalkBlocks = [
      // Block NW (De Santa Lounge & shops)
      { x: -35, z: 35, w: 46, d: 46 },
      // Block NE (Bank & tenements)
      { x: 35, z: 35, w: 46, d: 46 },
      // Block SW (Plaza & Auditorium)
      { x: -35, z: -35, w: 46, d: 46 },
      // Block SE (Alleys & Tailor shop)
      { x: 35, z: -35, w: 46, d: 46 }
    ];

    sidewalkBlocks.forEach((blk) => {
      const geo = new THREE.BoxGeometry(blk.w, 0.22, blk.d);
      const mesh = new THREE.Mesh(geo, sidewalkMat);
      mesh.position.set(blk.x, 0.11, blk.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // 3. Road Markings (White dashed lines & Crosswalks)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xddddcc });

    // North-South avenue center dashes
    for (let z = -70; z <= 70; z += 6) {
      if (Math.abs(z) > 12) {
        const dashGeo = new THREE.PlaneGeometry(0.35, 3.2);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.015, z);
        this.scene.add(dash);
      }
    }

    // East-West street center dashes
    for (let x = -70; x <= 70; x += 6) {
      if (Math.abs(x) > 12) {
        const dashGeo = new THREE.PlaneGeometry(3.2, 0.35);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.015, 0);
        this.scene.add(dash);
      }
    }

    // Crosswalk zebra stripes at central intersection
    const zebraOffsets = [-9.5, 9.5];
    zebraOffsets.forEach(pos => {
      // Horizontal crosswalks
      for (let i = -6; i <= 6; i += 1.6) {
        const zGeo = new THREE.PlaneGeometry(0.8, 4.0);
        const zMesh = new THREE.Mesh(zGeo, lineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(i, 0.016, pos);
        this.scene.add(zMesh);
      }
      // Vertical crosswalks
      for (let i = -6; i <= 6; i += 1.6) {
        const zGeo = new THREE.PlaneGeometry(4.0, 0.8);
        const zMesh = new THREE.Mesh(zGeo, lineMat);
        zMesh.rotation.x = -Math.PI / 2;
        zMesh.position.set(pos, 0.016, i);
        this.scene.add(zMesh);
      }
    });

    // 4. Glossy Water Puddles (Noir wet reflections)
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x080a0e,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });

    const puddlePositions = [
      { x: 3, z: 8, rx: 2.5, rz: 1.8 },
      { x: -5, z: -15, rx: 3.2, rz: 2.1 },
      { x: 18, z: 4, rx: 2.0, rz: 3.0 },
      { x: -22, z: 5, rx: 3.0, rz: 1.5 }
    ];

    puddlePositions.forEach(p => {
      const pGeo = new THREE.CircleGeometry(p.rx, 16);
      const pMesh = new THREE.Mesh(pGeo, puddleMat);
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.scale.set(1, p.rz / p.rx, 1);
      pMesh.position.set(p.x, 0.02, p.z);
      this.scene.add(pMesh);
    });
  }

  createKeyLandmarks() {
    // ---- 1. DE SANTA LOUNGE & JAZZ CLUB (NW Corner: x=-24, z=24) ----
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(-26, 0, 26);
    this.scene.add(loungeGroup);

    // Main Club Building
    const bGeo = new THREE.BoxGeometry(18, 14, 18);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x241d20, roughness: 0.8 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(0, 7, 0);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    loungeGroup.add(bMesh);

    // Art Deco Entrance Arch & Canopy
    const canopyGeo = new THREE.BoxGeometry(8, 0.8, 4.5);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x991818, roughness: 0.3 }); // Velvet red
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.2, 9.5);
    canopy.castShadow = true;
    loungeGroup.add(canopy);

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
    sctx.shadowBlur = 15;
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

    // Warm Gold Lounge Spotlight
    const clubLight = new THREE.PointLight(0xffaa33, 2.5, 18);
    clubLight.position.set(0, 4.0, 11);
    loungeGroup.add(clubLight);

    // Red carpet leading to street
    const carpetGeo = new THREE.PlaneGeometry(2.4, 6.0);
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.23, 11.2);
    loungeGroup.add(carpet);

    // ---- 2. SANTA TRUST BANK (NE Corner: x=26, z=26) ----
    const bankGroup = new THREE.Group();
    bankGroup.position.set(26, 0, 26);
    this.scene.add(bankGroup);

    // Bank Main Building
    const bankBldGeo = new THREE.BoxGeometry(20, 18, 20);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x3d434a, roughness: 0.6 });
    const bankBld = new THREE.Mesh(bankBldGeo, bankMat);
    bankBld.position.set(0, 9, 0);
    bankBld.castShadow = true;
    bankGroup.add(bankBld);

    // Neoclassical Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cd, roughness: 0.4 });
    const colOffsets = [-7, -3.5, 0, 3.5, 7];
    colOffsets.forEach(x => {
      const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 9.5, 16);
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 4.8, 10.5);
      col.castShadow = true;
      bankGroup.add(col);
    });

    // Bank Pediment (Triangle roof above columns)
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

    // ---- 3. GRAND AUDITORIUM (SW Corner: x=-26, z=-26) ----
    // Where the final Oral Presentation takes place!
    const audiGroup = new THREE.Group();
    audiGroup.position.set(-26, 0, -26);
    this.scene.add(audiGroup);

    const audiGeo = new THREE.BoxGeometry(22, 16, 22);
    const audiMat = new THREE.MeshStandardMaterial({ color: 0x332824, roughness: 0.7 });
    const audi = new THREE.Mesh(audiGeo, audiMat);
    audi.position.set(0, 8, 0);
    audi.castShadow = true;
    audiGroup.add(audi);

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

    // Presentation Stage Platform in front
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

    // ---- 4. TAILOR & BAKER SHOPS (SE Corner: x=26, z=-26) ----
    const shopGroup = new THREE.Group();
    shopGroup.position.set(26, 0, -26);
    this.scene.add(shopGroup);

    const shopGeo = new THREE.BoxGeometry(20, 14, 20);
    const shopMat = new THREE.MeshStandardMaterial({ color: 0x2e3532, roughness: 0.7 });
    const shop = new THREE.Mesh(shopGeo, shopMat);
    shop.position.set(0, 7, 0);
    shopGroup.add(shop);

    // Tailor Shop Awning & Sign
    const awningGeo = new THREE.BoxGeometry(6, 0.5, 3.2);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0x1d3f5e });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(-4.5, 3.8, 10.5);
    shopGroup.add(awning);

    // Baker Shop Awning (red & white stripes)
    const bAwningMat = new THREE.MeshStandardMaterial({ color: 0xa8422b });
    const bAwning = new THREE.Mesh(awningGeo, bAwningMat);
    bAwning.position.set(4.5, 3.8, 10.5);
    shopGroup.add(bAwning);
  }

  createCityBuildings() {
    // Perimeter city skyline rowhouses (blocks along edges)
    const bldColors = [0x2c3038, 0x382c2c, 0x24292e, 0x3d3935, 0x1e242b];
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

    bldPositions.forEach((b, idx) => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({
        color: bldColors[idx % bldColors.length],
        roughness: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Water tower on roof for noir atmosphere
      if (idx % 2 === 0) {
        this.createRoofWaterTower(b.x, b.h, b.z);
      }
    });
  }

  createRoofWaterTower(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a422e, roughness: 0.9 });

    // Legs
    for (let lx of [-1.5, 1.5]) {
      for (let lz of [-1.5, 1.5]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3), legMat);
        leg.position.set(lx, 1.5, lz);
        group.add(leg);
      }
    }

    // Wooden tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.2, 16), woodMat);
    tank.position.y = 4.2;
    group.add(tank);

    // Conical roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 16), legMat);
    roof.position.y = 6.4;
    group.add(roof);

    this.scene.add(group);
  }

  createPlazaAndFountain() {
    // Grand Fountain in Central Plaza (offset slightly into NW park zone: x=-6, z=6)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(-7, 0, 7);
    this.scene.add(fountainGroup);

    // Stone Basin
    const basinGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.7, 20);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.5 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.35;
    basin.castShadow = true;
    fountainGroup.add(basin);

    // Fountain Water Surface
    const waterGeo = new THREE.CircleGeometry(3.2, 20);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x225577,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.65;
    fountainGroup.add(water);

    // Central Pedestal & Spout
    const pedGeo = new THREE.CylinderGeometry(0.6, 0.8, 2.2, 12);
    const ped = new THREE.Mesh(pedGeo, basinMat);
    ped.position.y = 1.4;
    fountainGroup.add(ped);

    const bowlGeo = new THREE.CylinderGeometry(1.5, 0.8, 0.5, 16);
    const bowl = new THREE.Mesh(bowlGeo, basinMat);
    bowl.position.y = 2.4;
    fountainGroup.add(bowl);

    // Water Splash Particles
    const pCount = 30;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 1.5;
      pPos[i * 3 + 1] = 2.5 + Math.random() * 1.2;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.12,
      transparent: true,
      opacity: 0.7
    });
    this.fountainParticles = new THREE.Points(pGeo, pMat);
    fountainGroup.add(this.fountainParticles);

    // Surrounding Plaza Benches & Trees
    this.createParkBench(-11, 0.22, 7, 0);
    this.createParkBench(-7, 0.22, 11, Math.PI / 2);
    this.createPlazaTree(-11, 0.22, 11);
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
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 0.8 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.5), trunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), leavesMat);
    leaves.position.y = 4.8;
    leaves.scale.set(1, 1.3, 1);
    leaves.castShadow = true;
    group.add(leaves);

    this.scene.add(group);
  }

  createStreetFurniture() {
    // Classic 1930s Art Deco Streetlamps along sidewalks
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
    });

    // Fire hydrants
    this.createHydrant(-11.5, 0.22, 16);
    this.createHydrant(11.5, 0.22, -16);
  }

  createStreetLamp(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.22, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 4.8, 8), metalMat);
    post.position.y = 2.4;
    post.castShadow = true;
    group.add(post);

    // Lantern fixture
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffe699 });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.5, 6), lanternMat);
    lantern.position.y = 4.9;
    group.add(lantern);

    // Warm street light
    const light = new THREE.PointLight(0xffd677, 1.8, 14);
    light.position.set(0, 4.9, 0);
    group.add(light);
    this.lights.push(light);

    this.scene.add(group);
  }

  createHydrant(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const hMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65), hMat);
    body.position.y = 0.325;
    group.add(body);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), hMat);
    cap.position.y = 0.65;
    group.add(cap);

    this.scene.add(group);
  }

  spawnPedestrians() {
    // Ambient pedestrians walking the sidewalks
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

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.25), coatMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
    head.position.y = 1.55;
    group.add(head);

    // Optional Hat
    if (cfg.hat) {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.12, 12), hatMat);
      hat.position.y = 1.72;
      group.add(hat);
    }

    // Name label
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

  update(dt) {
    // Animate fountain water particles
    if (this.fountainParticles) {
      const pos = this.fountainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += Math.sin(Date.now() * 0.005 + i) * 0.015;
      }
      this.fountainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.CityWorld = CityWorld;

/**
 * Michelle De Santa 3D - Story Missions Engine
 * Faithfully follows the oral presentation lore:
 * 1. "The Reliable Friend" (Help friend Tommy in East Alley)
 * 2. "Not Greedy At All" (Collect cash & distribute to 3 friends)
 * 3. "Calm & Serious" (Defuse the Santa Bank standoff)
 * 4. "Never Boring" (The Legendary Oral Presentation at Grand Auditorium)
 */

class MissionManager {
  constructor(game) {
    this.game = game;
    this.currentMissionIndex = 0;
    this.missionStep = 0;
    this.loyaltyScore = 100;
    this.cashBalance = 1200;

    this.moneySacks = [];
    this.activeTargetMarker = null;

    this.initMissions();
  }

  initMissions() {
    this.missions = [
      {
        id: 1,
        title: "The Reliable Friend",
        tag: "MISSION 1",
        description: "Tommy is cornered by thugs in East Alley. Get there and save your friend!",
        targetPos: new THREE.Vector3(28, 0.5, 8),
        targetName: "East Alley",
        onStart: () => {
          this.game.showDialog(
            "Tommy (Radio)",
            "Michelle! It's Tommy! Two loan sharks cornered me in East Alley! They won't listen to reason! Help!",
            "assets/michelle_avatar.jpg"
          );
        },
        update: (dt) => {
          const dist = this.game.player.position.distanceTo(new THREE.Vector3(28, 0, 8));
          if (dist < 4.0 && this.missionStep === 0) {
            this.missionStep = 1;
            this.game.showDialog(
              "Thug Frankie",
              "Who do we have here? Michelle De Santa in his fancy striped suit! Back off, mobster!",
              "assets/michelle_avatar.jpg"
            );
            this.game.setObjective("PUNCH or BRIBE thugs [F / Q / Buttons] to protect Tommy!");
          }
          if (this.missionStep === 1) {
            // Check if player attacked or bribed
            if (this.game.player.state === 'punch' || this.game.player.state === 'throw') {
              this.missionStep = 2;
              setTimeout(() => {
                this.completeMission(1);
              }, 1200);
            }
          }
        }
      },
      {
        id: 2,
        title: "Not Greedy At All",
        tag: "MISSION 2",
        description: "Distribute the 3 recovered cash bags to friends in need across Santa District!",
        targetPos: new THREE.Vector3(0, 0, 0),
        targetName: "Plaza Sacks",
        onStart: () => {
          this.missionStep = 0;
          this.spawnMoneySacks();
          this.game.showDialog(
            "Michelle De Santa",
            "I never keep what isn't mine. As my friends know, I am not greedy at all. Let's help the neighborhood.",
            "assets/michelle_portrait.jpg"
          );
          this.game.setObjective("Collect the 3 cash sacks in the Central Plaza!");
        },
        update: (dt) => {
          if (this.missionStep === 0) {
            // Check cash collection
            for (let i = this.moneySacks.length - 1; i >= 0; i--) {
              const sack = this.moneySacks[i];
              if (this.game.player.position.distanceTo(sack.position) < 2.5) {
                this.game.scene.remove(sack);
                this.moneySacks.splice(i, 1);
                window.soundEngine.playCashThrow();
                this.cashBalance += 500;
                this.game.updateHUDStats();
                this.game.showToast("Cash Bag Collected! ($+500)");
              }
            }

            if (this.moneySacks.length === 0) {
              this.missionStep = 1;
              this.game.setObjective("Deliver aid to Luigi the Baker at the SE bakery! (x=24, z=-18)");
              this.currentMission.targetPos = new THREE.Vector3(24, 0.5, -18);
              this.currentMission.targetName = "Luigi's Bakery";
            }
          } else if (this.missionStep === 1) {
            const dist = this.game.player.position.distanceTo(new THREE.Vector3(24, 0, -18));
            if (dist < 4.0) {
              this.missionStep = 2;
              this.game.showDialog(
                "Luigi (Baker)",
                "Michelle! You brought fresh funds for the bakery! You are truly not greedy at all, always helping your friends!",
                "assets/michelle_portrait.jpg"
              );
              setTimeout(() => {
                this.completeMission(2);
              }, 1800);
            }
          }
        }
      },
      {
        id: 3,
        title: "Calm & Serious",
        tag: "MISSION 3",
        description: "The alarm tripped at Santa Trust Bank! Handle the tense standoff calmly without violence.",
        targetPos: new THREE.Vector3(26, 0.5, 26),
        targetName: "Santa Trust Bank",
        onStart: () => {
          this.missionStep = 0;
          this.game.showDialog(
            "Officer Davis",
            "Mr. De Santa! Armed hotheads are panicking inside the bank! If we rush in, someone gets hurt!",
            "assets/michelle_avatar.jpg"
          );
          this.game.setObjective("Enter Santa Trust Bank and use CALM FOCUS [C key / Calm button]!");
        },
        update: (dt) => {
          const dist = this.game.player.position.distanceTo(new THREE.Vector3(26, 0, 26));
          if (dist < 8.0 && this.missionStep === 0) {
            this.missionStep = 1;
            this.game.showDialog(
              "Michelle De Santa",
              "Panic is a weakness. Stay calm, stay serious. Watch this.",
              "assets/michelle_portrait.jpg"
            );
          }
          if (this.missionStep === 1) {
            if (this.game.isCalmFocusActive) {
              this.missionStep = 2;
              this.game.showDialog(
                "Bank Suspect",
                "Look at his eyes... he doesn't flinch at all! It's Michelle De Santa... Put the weapons down, boys, we can't shake this man!",
                "assets/michelle_portrait.jpg"
              );
              setTimeout(() => {
                this.completeMission(3);
              }, 2000);
            }
          }
        }
      },
      {
        id: 4,
        title: "Never Boring: The Oral Presentation",
        tag: "MISSION 4 (FINALE)",
        description: "Drive the V8 Roadster to the Grand Auditorium and deliver the legendary English Presentation!",
        targetPos: new THREE.Vector3(-26, 0.5, -26),
        targetName: "Grand Auditorium",
        onStart: () => {
          this.missionStep = 0;
          this.game.showDialog(
            "Crowd Announcer",
            "Ladies and gentlemen of Santa District! Welcome Michelle De Santa to the podium for his keynote speech!",
            "assets/michelle_portrait.jpg"
          );
          this.game.setObjective("Drive the V8 Roadster to the Grand Auditorium stage!");
        },
        update: (dt) => {
          const dist = this.game.player.position.distanceTo(new THREE.Vector3(-26, 0, -26));
          if (dist < 7.0 && this.missionStep === 0) {
            this.missionStep = 1;
            this.completeMission(4);
          }
        }
      }
    ];

    this.currentMission = this.missions[this.currentMissionIndex];
  }

  startMission(index) {
    if (index >= this.missions.length) {
      this.game.setObjective("FREE ROAM: Explore Santa District, drive the V8 Roadster, and enjoy the city!");
      this.currentMission = null;
      return;
    }
    this.currentMissionIndex = index;
    this.currentMission = this.missions[index];
    this.missionStep = 0;
    this.currentMission.onStart();
    this.updateHUDObjective();
  }

  completeMission(missionId) {
    window.soundEngine.playMissionComplete();
    this.loyaltyScore = Math.min(100, this.loyaltyScore + 25);
    this.cashBalance += 500;
    this.game.updateHUDStats();

    if (missionId === 4) {
      // Grand Finale: Open the Oral Presentation slide modal!
      this.game.showToast("★ TROPHY UNLOCKED: THE ULTIMATE BEST FRIEND ★");
      setTimeout(() => {
        this.game.openSlideModal();
        this.startMission(this.currentMissionIndex + 1);
      }, 1500);
    } else {
      this.game.showToast(`★ Mission ${missionId} Complete! (+Loyalty & Respect) ★`);
      setTimeout(() => {
        this.startMission(this.currentMissionIndex + 1);
      }, 2500);
    }
  }

  spawnMoneySacks() {
    const sackPositions = [
      new THREE.Vector3(-5, 0.4, 5),
      new THREE.Vector3(5, 0.4, -5),
      new THREE.Vector3(-3, 0.4, -12)
    ];

    const sackGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const sackMat = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      metalness: 0.3,
      roughness: 0.5
    });

    sackPositions.forEach(pos => {
      const sack = new THREE.Mesh(sackGeo, sackMat);
      sack.position.copy(pos);
      sack.scale.set(1, 1.2, 1);
      this.game.scene.add(sack);
      this.moneySacks.push(sack);
    });
  }

  update(dt) {
    if (this.currentMission && this.currentMission.update) {
      this.currentMission.update(dt);
      this.updateHUDObjective();
    }
  }

  updateHUDObjective() {
    if (!this.currentMission) return;
    const objEl = document.getElementById('current-objective');
    const tagEl = document.getElementById('objective-tag');
    const distEl = document.getElementById('objective-dist');

    if (objEl) objEl.textContent = this.currentMission.description;
    if (tagEl) tagEl.textContent = this.currentMission.tag;

    if (distEl && this.currentMission.targetPos) {
      const dist = Math.round(this.game.player.position.distanceTo(this.currentMission.targetPos));
      distEl.textContent = `📍 ${this.currentMission.targetName}: ${dist}m`;
    }
  }
}

window.MissionManager = MissionManager;

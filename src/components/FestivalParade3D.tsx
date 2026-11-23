import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CityRegionId } from '../game/stories';
import { MascotOutfit } from '../game/types';
import { soundService } from '../services/soundService';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Coins,
  FastForward,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

export interface ParadeRegionStop {
  id: CityRegionId;
  title: string;
  shortName: string;
  starsEarned: number;
  maxStars: number;
  completedCount: number;
  isFullyCompleted: boolean;
}

interface FestivalParade3DProps {
  stops: ParadeRegionStop[];
  outfit: MascotOutfit;
  isPreviewOnly?: boolean;
  onClaimAndClose: (coinsEarned: number, offeringsCollected: number) => void;
  onCloseWithoutClaim: () => void;
}

type CameraMode = 'follow' | 'wide' | 'close';

// Pre-allocated math helpers outside render loop (zero GC churn per frame)
const _vPos = new THREE.Vector3();
const _vAhead = new THREE.Vector3();
const _vRight = new THREE.Vector3();
const _vUp = new THREE.Vector3(0, 1, 0);
const _vCamTarget = new THREE.Vector3();
const _vLookTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();

/** Detects software WebGL renderers (SwiftShader, llvmpipe, WARP) to pace rendering safely */
function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/** Procedural Avengers Bifrost & Doomsday Titanium Energy Boulevard Texture */
function createBifrostRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark titanium alloy deck
  ctx.fillStyle = '#0D1525';
  ctx.fillRect(0, 0, 256, 512);

  // Subtle metallic grid plating
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(16,185,129,0.06)' : 'rgba(148,163,184,0.07)';
    ctx.fillRect((i * 73) % 256, (i * 137) % 512, 8, 4);
  }

  // Central Obsidian Conduit & Glowing Doomsday Emerald Rails
  ctx.fillStyle = '#06141A';
  ctx.fillRect(62, 0, 132, 512);
  ctx.fillStyle = '#10B981';
  ctx.fillRect(58, 0, 6, 512);
  ctx.fillRect(192, 0, 6, 512);
  ctx.fillStyle = '#6EE7B7';
  ctx.fillRect(68, 0, 3, 512);
  ctx.fillRect(185, 0, 3, 512);

  // Repeating Hexagonal Arc-Reactor Energy Nodes down the Bifrost highway
  for (let y = 64; y < 512; y += 128) {
    ctx.save();
    ctx.translate(128, y);
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const px = Math.cos(a) * 28;
      const py = Math.sin(a) * 28;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#A7F3D0';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 18);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

/** Procedural soft radial ground contact shadow texture */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(2, 8, 18, 0.72)');
  grad.addColorStop(0.55, 'rgba(16, 185, 129, 0.22)');
  grad.addColorStop(1, 'rgba(2, 8, 18, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface HeroRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  head: THREE.Group;
  reactorCore: THREE.Mesh;
}

/** Composite procedural 3D armored model of Commander Nova (grounded at y = 0) */
function buildHero3D(outfit: MascotOutfit, shadowTex: THREE.CanvasTexture): HeroRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const suitColors: Record<MascotOutfit, { armor: number; helmet: number; accent: number; glow: number }> = {
    halwai: { armor: 0x1e3a8a, helmet: 0x1d4ed8, accent: 0x38bdf8, glow: 0x10b981 },
    diwali_sherwani: { armor: 0x991b1b, helmet: 0xb91c1c, accent: 0xfacc15, glow: 0x38bdf8 },
    pongal_veshti: { armor: 0x065f46, helmet: 0x047857, accent: 0x34d399, glow: 0x6ee7b7 },
    holi_kurta: { armor: 0x312e81, helmet: 0x4338ca, accent: 0xc084fc, glow: 0x38bdf8 },
    royal_turban: { armor: 0x18181b, helmet: 0x27272a, accent: 0xa855f7, glow: 0xc084fc },
    santa_chef: { armor: 0x1e293b, helmet: 0x334155, accent: 0x10b981, glow: 0x34d399 },
  };
  const pal = suitColors[outfit] ?? suitColors.halwai;

  const armorMat = new THREE.MeshStandardMaterial({ color: pal.armor, roughness: 0.28, metalness: 0.78 });
  const darkAlloyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.8 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: pal.helmet, roughness: 0.25, metalness: 0.82 });
  const accentMat = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.22, metalness: 0.85 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: pal.glow,
    emissive: pal.glow,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  // Ground contact shadow plane
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 1.85),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  root.add(shadowPlane);

  // Armored Greave Legs
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.34, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, darkAlloyMat);
  leftLeg.position.set(-0.22, 0.32, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, darkAlloyMat);
  rightLeg.position.set(0.22, 0.32, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Lower Tactical Belt & Hip Armor
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.35, 0.38, 16), darkAlloyMat);
  hips.position.y = 0.74;
  hips.castShadow = true;
  bodyGroup.add(hips);

  // Chest Cuirass
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.72, 16), armorMat);
  torso.position.y = 1.24;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Shoulder Pauldrons
  const pauldronGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const leftPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  leftPauldron.position.set(-0.5, 1.48, 0);
  bodyGroup.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  rightPauldron.position.set(0.5, 1.48, 0);
  bodyGroup.add(rightPauldron);

  // Glowing Chest Arc Reactor Core
  const reactorRim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 18), accentMat);
  reactorRim.position.set(0, 1.3, 0.43);
  bodyGroup.add(reactorRim);

  const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 16), glowMat);
  reactorCore.rotation.x = Math.PI / 2;
  reactorCore.position.set(0, 1.3, 0.44);
  bodyGroup.add(reactorCore);

  // Tactical Utility Belt
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.055, 8, 22), accentMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.92;
  bodyGroup.add(belt);

  // Tactical Cape (trailing behind)
  const cape = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 1.15, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.65, metalness: 0.18 })
  );
  cape.position.set(0, 1.02, -0.44);
  cape.rotation.x = 0.16;
  bodyGroup.add(cape);

  // Armored Helmet Head
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0);
  bodyGroup.add(head);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), helmetMat);
  cranium.castShadow = true;
  head.add(cranium);

  // Glowing Visor Strip
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.11, 0.18), glowMat);
  visor.position.set(0, 0.04, 0.31);
  head.add(visor);

  // Helmet Crest Fin
  const crestFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.44), accentMat);
  crestFin.position.set(0, 0.34, 0.02);
  head.add(crestFin);

  // Articulated Left Arm holding Concentric Vibranium Shield!
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.52, 1.4, 0);
  bodyGroup.add(leftArm);

  const armGeo = new THREE.CapsuleGeometry(0.11, 0.38, 6, 10);
  const leftArmMesh = new THREE.Mesh(armGeo, armorMat);
  leftArmMesh.position.set(-0.1, -0.1, 0.16);
  leftArmMesh.rotation.set(-0.6, 0, 0.4);
  leftArm.add(leftArmMesh);

  // Concentric Vibranium Shield
  const shieldOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.22, metalness: 0.78 })
  );
  shieldOuter.rotation.x = Math.PI / 2;
  shieldOuter.position.set(-0.22, -0.12, 0.44);
  leftArm.add(shieldOuter);

  const shieldRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.07, 22),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, metalness: 0.8 })
  );
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.set(-0.22, -0.12, 0.45);
  leftArm.add(shieldRing);

  const shieldCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2, metalness: 0.75 })
  );
  shieldCore.rotation.x = Math.PI / 2;
  shieldCore.position.set(-0.22, -0.12, 0.46);
  leftArm.add(shieldCore);

  // Articulated Right Arm (raising glowing Repulsor Gauntlet!)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.52, 1.4, 0);
  bodyGroup.add(rightArm);

  const rightArmMesh = new THREE.Mesh(armGeo, armorMat);
  rightArmMesh.position.set(0.14, 0.1, 0.1);
  rightArmMesh.rotation.set(-0.3, 0, -0.72);
  rightArm.add(rightArmMesh);

  const repulsorHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), glowMat);
  repulsorHand.position.set(0.3, 0.26, 0.18);
  rightArm.add(repulsorHand);

  return { root, bodyGroup, leftArm, rightArm, leftLeg, rightLeg, head, reactorCore };
}

/** Builds a distinctive multi-part 3D Avengers Sector Landmark for each completed Sector */
function buildSectorLandmark3D(regionId: CityRegionId): THREE.Group {
  const group = new THREE.Group();
  const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.85 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.38, metalness: 0.82 });
  const emeraldGlowMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.35,
    roughness: 0.15,
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.3,
    roughness: 0.15,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.88 });

  // Grounded circular armored plinth (bottom at y = 0)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.6, 0.4, 24), darkMetalMat);
  plinth.position.y = 0.2;
  plinth.receiveShadow = true;
  group.add(plinth);

  if (regionId === 'chennai_marina') {
    // Sector I: Coastal Citadel Arc Beacon
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.14, 10, 28), cyanGlowMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.28;
    group.add(ring);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 4.2, 8), titaniumMat);
    tower.position.y = 2.5;
    tower.castShadow = true;
    group.add(tower);

    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), cyanGlowMat);
    beacon.position.y = 5.1;
    group.add(beacon);
  } else if (regionId === 'madurai_temple') {
    // Sector II: Sanctum Spires Arcane Citadel
    const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.32, metalness: 0.72 });
    for (let i = 0; i < 4; i++) {
      const w = 2.4 - i * 0.42;
      const tier = new THREE.Mesh(new THREE.BoxGeometry(w, 0.85, w * 0.75), i % 2 === 0 ? crimsonMat : titaniumMat);
      tier.position.y = 0.82 + i * 0.85;
      tier.castShadow = true;
      group.add(tier);
    }
    const sanctumPortal = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.11, 10, 24), goldMat);
    sanctumPortal.position.y = 4.65;
    group.add(sanctumPortal);

    const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), emeraldGlowMat);
    eyeCore.position.y = 4.65;
    group.add(eyeCore);
  } else if (regionId === 'kanyakumari') {
    // Sector III: Trident Abyss Energy Relay
    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 1.05, 3.8, 6), titaniumMat);
    obelisk.position.y = 2.3;
    obelisk.castShadow = true;
    group.add(obelisk);

    const energyArch = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.11, 10, 28, Math.PI), emeraldGlowMat);
    energyArch.position.set(0, 2.2, 0);
    group.add(energyArch);

    const tridentOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), cyanGlowMat);
    tridentOrb.position.y = 4.55;
    group.add(tridentOrb);
  } else if (regionId === 'jaipur') {
    // Sector IV: Astral Fortress Quantum Spire
    const violetMat = new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.28, metalness: 0.75 });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), violetMat);
    crystal.scale.set(0.8, 1.85, 0.8);
    crystal.position.y = 2.7;
    crystal.castShadow = true;
    group.add(crystal);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 10, 26), goldMat);
    ring1.position.y = 2.7;
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 10, 24), cyanGlowMat);
    ring2.position.y = 2.7;
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);
  } else {
    // Sector V: Doomsday Nexus Obsidian Gate
    [-1.25, 1.25].forEach((x) => {
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.9, 1.05), darkMetalMat);
      monolith.position.set(x, 2.35, 0);
      monolith.castShadow = true;
      group.add(monolith);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.6, 1.12), emeraldGlowMat);
      trim.position.set(x, 2.35, 0);
      group.add(trim);
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.75, 1.15), titaniumMat);
    lintel.position.y = 4.35;
    group.add(lintel);

    const nexusCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), emeraldGlowMat);
    nexusCore.position.set(0, 2.55, 0);
    group.add(nexusCore);
  }

  return group;
}

interface ShardNode {
  mesh: THREE.Group;
  t: number; // 0..1 along curve
  basePos: THREE.Vector3;
  collected: boolean;
  collectProgress: number;
  coinValue: number;
  phase: number;
}

interface SparkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

export const FestivalParade3D: React.FC<FestivalParade3DProps> = ({
  stops,
  outfit,
  isPreviewOnly = false,
  onClaimAndClose,
  onCloseWithoutClaim,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [speedMult, setSpeedMult] = useState<1 | 1.5>(1);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [shardsCollected, setShardsCollected] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [marchFinished, setMarchFinished] = useState(false);

  // Refs read inside Three.js animation loop so React state changes never reset the WebGL scene
  const cameraModeRef = useRef<CameraMode>('follow');
  const speedMultRef = useRef<number>(1);
  const leapImpulseRef = useRef<number>(0);
  const skipRequestedRef = useRef<boolean>(false);
  const finishedRef = useRef<boolean>(false);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    speedMultRef.current = speedMult;
  }, [speedMult]);

  const activeStops = useMemo<ParadeRegionStop[]>(() => {
    if (stops.length > 0) return stops;
    return [
      {
        id: 'chennai_marina',
        title: 'Coastal Citadel',
        shortName: 'Sector I',
        starsEarned: 0,
        maxStars: 36,
        completedCount: 0,
        isFullyCompleted: false,
      },
    ];
  }, [stops]);

  const triggerHeroLeap = useCallback(() => {
    if (finishedRef.current) return;
    leapImpulseRef.current = 1.0;
    soundService.playParadeLeap();
  }, []);

  // Keyboard shortcuts: Space = Hero Leap, H = Collapse HUD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        triggerHeroLeap();
      } else if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerHeroLeap]);

  // Mount & run full Three.js 3D Avengers Victory March scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.019);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 180);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio environment map for PBR titanium & metallic armor reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Cinematic Avengers Doomsday 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0x6ee7b7, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    keyLight.position.set(16, 28, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -28;
    keyLight.shadow.camera.right = 28;
    keyLight.shadow.camera.top = 28;
    keyLight.shadow.camera.bottom = -28;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.35);
    rimLight.position.set(-14, 12, -18);
    scene.add(rimLight);

    // Open cosmic obsidian ground plane extending to horizon fog
    const groundGeo = new THREE.CircleGeometry(140, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x09111f,
      roughness: 0.85,
      metalness: 0.25,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build graceful serpentine 3D Bifrost boulevard scaled to completed sectors
    const stopCount = activeStops.length;
    const segmentLen = 14;
    const totalLen = Math.max(24, stopCount * segmentLen + 8);
    const curvePts: THREE.Vector3[] = [];
    const numCtrl = Math.max(5, stopCount * 2 + 2);
    for (let i = 0; i < numCtrl; i++) {
      const frac = i / (numCtrl - 1);
      const z = -frac * totalLen;
      const x = Math.sin(frac * Math.PI * Math.max(1.5, stopCount * 0.95)) * 5.2;
      curvePts.push(new THREE.Vector3(x, 0, z));
    }
    const marchCurve = new THREE.CatmullRomCurve3(curvePts);

    // Procedural Ribbon Road Geometry following the Catmull-Rom curve
    const roadTexture = createBifrostRoadTexture(renderer.capabilities.getMaxAnisotropy());
    const roadSegs = 90;
    const roadHalfW = 2.55;
    const roadPositions: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];
    for (let i = 0; i <= roadSegs; i++) {
      const u = i / roadSegs;
      const pt = marchCurve.getPointAt(u);
      const tan = marchCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(tan, _vUp).normalize();
      const leftPt = pt.clone().addScaledVector(right, -roadHalfW);
      const rightPt = pt.clone().addScaledVector(right, roadHalfW);
      roadPositions.push(leftPt.x, 0.02, leftPt.z, rightPt.x, 0.02, rightPt.z);
      roadUvs.push(0, u, 1, u);
      if (i < roadSegs) {
        const b = i * 2;
        roadIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.45,
      metalness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // InstancedMesh Titanium Energy Pylons lining the Bifrost avenue
    const pylonCount = Math.min(64, stopCount * 10 + 14);
    const pillarGeo = new THREE.CylinderGeometry(0.11, 0.18, 2.0, 6);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.85 });
    const pillarsInst = new THREE.InstancedMesh(pillarGeo, pillarMat, pylonCount);
    pillarsInst.frustumCulled = false;

    const beaconGeo = new THREE.OctahedronGeometry(0.24, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
    const beaconsInst = new THREE.InstancedMesh(beaconGeo, beaconMat, pylonCount);
    beaconsInst.frustumCulled = false;

    for (let i = 0; i < pylonCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const u = Math.min(0.98, (Math.floor(i / 2) + 0.5) / (pylonCount / 2));
      const pt = marchCurve.getPointAt(u);
      const tan = marchCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(tan, _vUp).normalize();
      const offsetDist = roadHalfW + 0.85;

      _dummy.position.set(pt.x + right.x * side * offsetDist, 1.0, pt.z + right.z * side * offsetDist);
      _dummy.scale.setScalar(0.92 + (i % 3) * 0.08);
      _dummy.rotation.set(0, 0, 0);
      _dummy.updateMatrix();
      pillarsInst.setMatrixAt(i, _dummy.matrix);

      _dummy.position.y = 2.18;
      _dummy.updateMatrix();
      beaconsInst.setMatrixAt(i, _dummy.matrix);
    }
    pillarsInst.instanceMatrix.needsUpdate = true;
    beaconsInst.instanceMatrix.needsUpdate = true;
    scene.add(pillarsInst, beaconsInst);

    // Place 3D Avengers Sector Landmarks along alternating sides of the boulevard
    const stopFractions: number[] = [];
    activeStops.forEach((stop, idx) => {
      const u = (idx + 0.55) / (stopCount + 0.25);
      stopFractions.push(u);
      const pt = marchCurve.getPointAt(u);
      const tan = marchCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(tan, _vUp).normalize();
      const side = idx % 2 === 0 ? 1 : -1;

      const landmark = buildSectorLandmark3D(stop.id);
      landmark.position.set(pt.x + right.x * side * 6.4, 0, pt.z + right.z * side * 6.4);
      landmark.lookAt(pt.x, 0, pt.z);
      scene.add(landmark);
    });

    // Spawn Glowing 3D Infinity Shards (Emerald Time Prism, Cyan Tesseract Cube, Gold Mind Core)
    const shards: ShardNode[] = [];
    const shardEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.65,
    });
    const shardCyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.5,
    });
    const shardGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.18,
      metalness: 0.82,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const prismGeo = new THREE.OctahedronGeometry(0.32, 0);
    const cubeGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const coreGeo = new THREE.DodecahedronGeometry(0.28, 0);
    const haloGeo = new THREE.RingGeometry(0.38, 0.46, 18);

    const shardsPerStop = isPreviewOnly ? 6 : 8;
    const totalShards = stopCount * shardsPerStop;

    for (let i = 0; i < totalShards; i++) {
      const tVal = 0.08 + (i / Math.max(1, totalShards - 1)) * 0.86;
      const pt = marchCurve.getPointAt(tVal);
      const tan = marchCurve.getTangentAt(tVal).normalize();
      const right = new THREE.Vector3().crossVectors(tan, _vUp).normalize();
      const lateral = Math.sin(i * 1.45) * 1.35;

      const nodeGroup = new THREE.Group();
      const kind = i % 3;
      const coreMesh =
        kind === 0
          ? new THREE.Mesh(prismGeo, shardEmeraldMat)
          : kind === 1
          ? new THREE.Mesh(cubeGeo, shardCyanMat)
          : new THREE.Mesh(coreGeo, shardGoldMat);
      nodeGroup.add(coreMesh);

      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      const basePos = new THREE.Vector3(pt.x + right.x * lateral, 1.15 + (i % 2) * 0.3, pt.z + right.z * lateral);
      nodeGroup.position.copy(basePos);
      scene.add(nodeGroup);

      shards.push({
        mesh: nodeGroup,
        t: tVal,
        basePos,
        collected: false,
        collectProgress: 0,
        coinValue: isPreviewOnly ? 2 : 3,
        phase: i * 0.7,
      });
    }

    // Floating Ambient Emerald Energy Sparkle Particle Field
    const maxSparks = 140;
    const sparkPositions = new Float32Array(maxSparks * 3);
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.25,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    sparkPoints.frustumCulled = false;
    scene.add(sparkPoints);

    const activeSparks: SparkParticle[] = Array.from({ length: maxSparks }, () => ({
      pos: new THREE.Vector3(0, -50, 0),
      vel: new THREE.Vector3(0, 0, 0),
      life: 0,
    }));
    let sparkCursor = 0;

    const emitSparks = (origin: THREE.Vector3, count = 14) => {
      for (let k = 0; k < count; k++) {
        const sp = activeSparks[sparkCursor % maxSparks];
        sparkCursor++;
        sp.pos.copy(origin);
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * 3.4;
        sp.vel.set(Math.cos(angle) * speed, 2.2 + Math.random() * 3.5, Math.sin(angle) * speed);
        sp.life = 0.65 + Math.random() * 0.45;
      }
    };

    // Build Armored 3D Commander Nova Hero
    const shadowTex = createContactShadowTexture();
    const hero = buildHero3D(outfit, shadowTex);
    scene.add(hero.root);

    // Place initial camera smoothly behind Commander Nova
    const startPt = marchCurve.getPointAt(0);
    camera.position.set(startPt.x + 4, 4.8, startPt.z + 7.5);
    camera.lookAt(startPt.x, 1.4, startPt.z - 4);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Simulation state
    const clock = new THREE.Clock();
    let marchT = 0;
    const baseDurationSec = Math.max(9.5, stopCount * 4.2 + 4.5);
    let collectedCount = 0;
    let totalCredits = 0;
    let lastReportedStop = 0;
    let lastReportedPct = 0;
    const _vSide = new THREE.Vector3();
    const _vSparkOrigin = new THREE.Vector3();
    let frameId = 0;
    let disposed = false;

    const completeMarch = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      for (const s of shards) {
        if (!s.collected) {
          s.collected = true;
          s.mesh.visible = false;
          collectedCount++;
          totalCredits += s.coinValue;
        }
      }
      setShardsCollected(collectedCount);
      setCreditsEarned(totalCredits);
      setProgressPct(100);
      setMarchFinished(true);
      soundService.playWin();
    };

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      if (skipRequestedRef.current && !finishedRef.current) {
        marchT = 1;
        completeMarch();
      }

      if (!finishedRef.current) {
        marchT = Math.min(1, marchT + (delta * speedMultRef.current) / baseDurationSec);
        if (marchT >= 1) {
          completeMarch();
        }
      }

      // Position & orient Commander Nova along the serpentine Bifrost highway
      const clampedT = Math.min(0.995, marchT);
      marchCurve.getPointAt(clampedT, _vPos);
      marchCurve.getPointAt(Math.min(1, clampedT + 0.015), _vAhead);
      hero.root.position.copy(_vPos);
      hero.root.lookAt(_vAhead.x, _vPos.y, _vAhead.z);

      // Decay Hero Leap impulse
      if (leapImpulseRef.current > 0) {
        leapImpulseRef.current = Math.max(0, leapImpulseRef.current - delta * 1.9);
      }
      const leapArc = Math.sin(leapImpulseRef.current * Math.PI) * 1.55;
      const leapSpin = leapImpulseRef.current > 0 ? (1 - leapImpulseRef.current) * Math.PI * 2 : 0;

      // Heroic Victory Stride Kinematics
      const beat = elapsed * 9.5 * speedMultRef.current;
      const bounce = Math.abs(Math.sin(beat)) * 0.24;
      hero.bodyGroup.position.y = bounce + leapArc;
      hero.bodyGroup.rotation.y = leapSpin + Math.sin(beat * 0.5) * 0.18;
      hero.bodyGroup.rotation.z = Math.sin(beat * 0.5) * 0.08;

      hero.leftLeg.rotation.x = Math.sin(beat) * 0.55;
      hero.rightLeg.rotation.x = -Math.sin(beat) * 0.55;
      hero.rightArm.rotation.z = Math.sin(beat * 1.2) * 0.42;
      hero.leftArm.rotation.x = Math.sin(beat) * 0.16;
      hero.head.rotation.z = Math.sin(beat * 0.5) * 0.1;
      hero.reactorCore.scale.setScalar(1 + Math.sin(elapsed * 7) * 0.1);

      // Update Infinity Shards: spin, hover, magnet-collect when Commander Nova passes nearby!
      const magnetRadius = leapImpulseRef.current > 0.05 ? 4.8 : 2.9;
      let freshlyCollected = false;

      for (const s of shards) {
        if (!s.mesh.visible) continue;
        s.mesh.rotation.y = elapsed * 2.6 + s.phase;

        if (!s.collected) {
          s.mesh.position.y = s.basePos.y + Math.sin(elapsed * 3.2 + s.phase) * 0.2;
          const dist = s.mesh.position.distanceTo(_vPos);
          if (dist < magnetRadius || s.t <= clampedT + 0.012) {
            s.collected = true;
            collectedCount++;
            totalCredits += s.coinValue;
            freshlyCollected = true;
            emitSparks(s.mesh.position, 14);
            soundService.playParadeOffering(collectedCount);
          }
        } else {
          s.collectProgress = Math.min(1, s.collectProgress + delta * 4.5);
          const targetY = _vPos.y + 1.35 + leapArc;
          s.mesh.position.x = THREE.MathUtils.lerp(s.mesh.position.x, _vPos.x, 0.28);
          s.mesh.position.y = THREE.MathUtils.lerp(s.mesh.position.y, targetY, 0.28);
          s.mesh.position.z = THREE.MathUtils.lerp(s.mesh.position.z, _vPos.z, 0.28);
          s.mesh.scale.setScalar(Math.max(0.05, 1 - s.collectProgress));
          if (s.collectProgress >= 1) {
            s.mesh.visible = false;
          }
        }
      }

      if (freshlyCollected) {
        setShardsCollected(collectedCount);
        setCreditsEarned(totalCredits);
      }

      // Emit emerald energy trail beneath Commander Nova's boots
      if (Math.random() < (leapImpulseRef.current > 0 ? 0.85 : 0.25)) {
        _vSparkOrigin.set(_vPos.x, _vPos.y + 0.45 + leapArc, _vPos.z);
        emitSparks(_vSparkOrigin, 2);
      }

      // Advance sparkle particles
      const posAttr = sparkGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < maxSparks; i++) {
        const sp = activeSparks[i];
        if (sp.life > 0) {
          sp.life -= delta;
          sp.pos.addScaledVector(sp.vel, delta);
          sp.vel.y -= 5.8 * delta;
          posAttr.setXYZ(i, sp.pos.x, sp.pos.y, sp.pos.z);
        } else {
          posAttr.setXYZ(i, 0, -50, 0);
        }
      }
      posAttr.needsUpdate = true;

      // Update active sector banner & percentage smoothly
      const nextPct = Math.round(marchT * 100);
      if (nextPct !== lastReportedPct) {
        lastReportedPct = nextPct;
        setProgressPct(nextPct);
      }
      let activeIdx = 0;
      for (let i = 0; i < stopFractions.length; i++) {
        if (marchT >= stopFractions[i] - 0.08) activeIdx = i;
      }
      if (activeIdx !== lastReportedStop) {
        lastReportedStop = activeIdx;
        setCurrentStopIdx(activeIdx);
      }

      // Damped Cinematic Camera Rig following Commander Nova
      _vRight.subVectors(_vAhead, _vPos).normalize();
      _vSide.crossVectors(_vRight, _vUp).normalize();
      const mode = cameraModeRef.current;

      if (mode === 'wide') {
        _vCamTarget
          .copy(_vPos)
          .addScaledVector(_vRight, -10.5)
          .addScaledVector(_vSide, 6.2);
        _vCamTarget.y = 7.4;
      } else if (mode === 'close') {
        _vCamTarget
          .copy(_vPos)
          .addScaledVector(_vRight, 4.4)
          .addScaledVector(_vSide, 2.6);
        _vCamTarget.y = 2.5;
      } else {
        _vCamTarget
          .copy(_vPos)
          .addScaledVector(_vRight, -6.4)
          .addScaledVector(_vSide, 3.0);
        _vCamTarget.y = 4.1;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _vCamTarget.x, 4.2, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _vCamTarget.y, 4.2, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _vCamTarget.z, 4.2, delta);

      _vLookTarget.copy(_vPos);
      _vLookTarget.y += 1.45;
      camera.lookAt(_vLookTarget);

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      roadTexture.dispose();
      shadowTex.dispose();
      envTarget.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStops, outfit, isPreviewOnly]);

  const activeStop = activeStops[Math.min(currentStopIdx, activeStops.length - 1)];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#060B14] select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Avengers Victory March 3D"
    >
      {/* Dedicated Isolated WebGL Canvas Container (Click/Tap triggers Commander Nova's Hero Leap!) */}
      <div
        ref={mountRef}
        onClick={triggerHeroLeap}
        className="absolute inset-0 h-full w-full cursor-pointer"
      />

      {/* Minimal Top-Left March Spec & Live Infinity Shard Tally */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-2xl border border-emerald-500/45 bg-[rgba(8,14,26,0.92)] px-4 py-2.5 text-slate-100 shadow-lg max-w-xs sm:max-w-sm">
          <div className="text-[11px] font-bold text-emerald-300 tabular-nums">
            Victory March 3D · Sector {currentStopIdx + 1} of {activeStops.length} · {progressPct}%
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-black text-white leading-tight">
            {activeStop.title}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-bold tabular-nums text-slate-200">
            <span className="flex items-center gap-1 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" /> {shardsCollected} Shards
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-amber-300">
              <Coins className="w-3.5 h-3.5" /> +{creditsEarned} Credits
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseWithoutClaim}
          aria-label="Close Victory March"
          className="pointer-events-auto flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-emerald-500/45 bg-[rgba(8,14,26,0.92)] text-emerald-200 hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      {!marchFinished && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(680px,94vw)] flex flex-col items-center transition-transform duration-200"
          style={{ transform: dockCollapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)' }}
        >
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="mb-1 flex items-center gap-1 rounded-t-xl border border-b-0 border-emerald-500/45 bg-[rgba(8,14,26,0.94)] px-3 py-1 text-[11px] font-bold text-emerald-300 hover:text-white whitespace-nowrap"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
          </button>

          <div className="w-full rounded-2xl border border-emerald-500/50 bg-[rgba(8,14,26,0.94)] px-3 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2">
            {/* Hero Leap Action */}
            <button
              type="button"
              onClick={triggerHeroLeap}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 text-xs font-black text-slate-950 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hero Leap</span>
            </button>

            {/* Camera Angle Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-black/45 p-1">
              {(
                [
                  { id: 'follow', label: 'Follow' },
                  { id: 'wide', label: 'Wide' },
                  { id: 'close', label: 'Close' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setCameraMode(cam.id)}
                  className={`flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    cameraMode === cam.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cam.id === 'follow' && <Camera className="w-3 h-3" />}
                  <span>{cam.label}</span>
                </button>
              ))}
            </div>

            {/* Speed & Finish Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSpeedMult((s) => (s === 1 ? 1.5 : 1))}
                className="min-h-[40px] rounded-xl border border-emerald-500/45 bg-slate-900 px-3 text-xs font-bold text-emerald-200 hover:bg-slate-800 whitespace-nowrap tabular-nums"
              >
                {speedMult}x Speed
              </button>
              <button
                type="button"
                onClick={() => {
                  skipRequestedRef.current = true;
                }}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border border-emerald-500/45 bg-slate-900 px-3 text-xs font-bold text-emerald-200 hover:bg-slate-800 whitespace-nowrap"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Finish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory March Complete Celebration & Credits Claim Card */}
      {marchFinished && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border-2 border-emerald-400/70 bg-[#0D1628] p-6 text-center text-slate-100 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="mt-3 text-xs font-bold text-emerald-300">
              {isPreviewOnly
                ? 'Opening Sector Patrol Complete'
                : `${activeStops.length} ${activeStops.length === 1 ? 'Sector' : 'Sectors'} Secured`}
            </div>
            <h2 className="mt-0.5 text-2xl font-black text-white">
              Victory March Complete!
            </h2>
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
              Commander Nova marched through {activeStops.map((s) => s.shortName).join(', ')} and collected{' '}
              <strong className="tabular-nums text-emerald-300">{shardsCollected}</strong> glowing Infinity Shards.
            </p>

            <div className="mt-4 rounded-2xl border border-emerald-500/35 bg-slate-900/90 p-3.5 flex items-center justify-center gap-2 text-xl font-black text-amber-300 tabular-nums">
              <Coins className="w-6 h-6 text-amber-400" />
              <span>+{creditsEarned} Bonus Credits</span>
            </div>

            {isPreviewOnly && (
              <p className="mt-2.5 text-xs text-slate-400">
                Complete missions across more Sectors to extend your 3D Bifrost route and harvest bigger Shard bonuses!
              </p>
            )}

            <button
              type="button"
              onClick={() => onClaimAndClose(creditsEarned, shardsCollected)}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 text-sm font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Coins className="w-4 h-4" />
              <span>Claim +{creditsEarned} Credits</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

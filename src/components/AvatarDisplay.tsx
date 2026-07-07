import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DEFAULT_PUBLIC_AVATAR,
  shopItemById,
  type PublicAvatar,
  type ShopItemId,
} from "../../shared/game";
import { cn } from "../lib/utils";

type AvatarDisplaySize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarDisplaySize, string> = {
  sm: "size-12",
  md: "size-16",
  lg: "size-24",
  xl: "size-36",
};

// Teinte sombre structurelle (visières, pupilles, museaux) : ce n'est pas une
// couleur de preview du catalogue, juste un noir doux réutilisé partout.
const DARK = new THREE.Color(0x10141b);

type Palette = {
  accent: THREE.Color;
  hat: THREE.Color;
  hatAccent: THREE.Color;
  hatSecondary: THREE.Color;
  primary: THREE.Color;
  secondary: THREE.Color;
  shirt: THREE.Color;
  shirtAccent: THREE.Color;
};

function previewColor(
  itemId: ShopItemId | undefined,
  token: "primary" | "secondary" | "accent",
  fallback: string,
) {
  return itemId ? (shopItemById(itemId)?.preview[token] ?? fallback) : fallback;
}

function paletteFromAvatar(avatar: PublicAvatar): Palette {
  return {
    primary: new THREE.Color(previewColor(avatar.avatarId, "primary", "#538d4e")),
    secondary: new THREE.Color(previewColor(avatar.avatarId, "secondary", "#f8fafc")),
    accent: new THREE.Color(previewColor(avatar.avatarId, "accent", "#f97316")),
    shirt: new THREE.Color(previewColor(avatar.shirtId, "primary", "#111318")),
    shirtAccent: new THREE.Color(previewColor(avatar.shirtId, "accent", "#538d4e")),
    hat: new THREE.Color(previewColor(avatar.hatId, "primary", "#facc15")),
    hatAccent: new THREE.Color(previewColor(avatar.hatId, "accent", "#ffffff")),
    hatSecondary: new THREE.Color(previewColor(avatar.hatId, "secondary", "#ffffff")),
  };
}

function material(color: THREE.Color, roughness = 0.54, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
}

// Matière translucide (gel, fantôme) : blending sur fond transparent.
function glassy(color: THREE.Color, opacity: number, roughness = 0.2) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.05,
    opacity,
    roughness,
    transparent: true,
  });
}

function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material) {
  return new THREE.Mesh(geometry, mat);
}

function add(object: THREE.Object3D, parent: THREE.Object3D) {
  parent.add(object);
  return object;
}

// Paire d'yeux symétriques, réutilisée par la plupart des silhouettes.
function addEyes(
  parent: THREE.Object3D,
  color: THREE.Color,
  radius: number,
  y: number,
  z: number,
  x: number,
) {
  const eyeMaterial = material(color, 0.36, 0.05);
  [-x, x].forEach((px) => {
    const eye = mesh(new THREE.SphereGeometry(radius, 16, 12), eyeMaterial);
    eye.position.set(px, y, z);
    add(eye, parent);
  });
}

function buildHead(avatar: PublicAvatar, palette: Palette) {
  const headGroup = new THREE.Group();
  const id = avatar.avatarId;
  let head: THREE.Mesh;

  if (id === "avatar-robot") {
    head = mesh(
      new THREE.BoxGeometry(1.22, 1.02, 0.96, 3, 3, 3),
      material(palette.primary, 0.38, 0.32),
    );
  } else if (id === "avatar-dragon") {
    head = mesh(new THREE.IcosahedronGeometry(0.72, 1), material(palette.primary, 0.5, 0.12));
    head.scale.set(1.1, 0.92, 0.92);
  } else if (id === "avatar-slime") {
    head = mesh(new THREE.SphereGeometry(0.72, 36, 24), glassy(palette.primary, 0.85, 0.18));
    head.scale.set(1.06, 0.82, 1.05);
  } else if (id === "avatar-fantome") {
    head = mesh(new THREE.SphereGeometry(0.72, 36, 24), glassy(palette.primary, 0.72, 0.22));
    head.scale.set(1.04, 1.06, 1);
  } else if (id === "avatar-citrouille") {
    head = mesh(new THREE.SphereGeometry(0.72, 36, 24), material(palette.primary, 0.6, 0.05));
    head.scale.set(1.14, 0.86, 1.14);
  } else if (id === "avatar-grenouille") {
    // Tête verte légèrement large et bombée.
    head = mesh(new THREE.SphereGeometry(0.7, 36, 24), material(palette.primary, 0.5, 0.06));
    head.scale.set(1.12, 0.96, 1.02);
  } else if (id === "avatar-requin") {
    // Tête grise anguleuse (icosaèdre) étirée vers l'avant (museau).
    head = mesh(new THREE.IcosahedronGeometry(0.66, 1), material(palette.primary, 0.48, 0.12));
    head.scale.set(0.92, 0.82, 1.42);
  } else if (id === "avatar-tigre") {
    head = mesh(new THREE.SphereGeometry(0.68, 36, 24), material(palette.primary, 0.5, 0.08));
    head.scale.set(1.08, 0.94, 1.02);
  } else if (id === "avatar-licorne") {
    head = mesh(new THREE.SphereGeometry(0.68, 36, 24), material(palette.primary, 0.46, 0.06));
    head.scale.set(1.02, 1.02, 0.98);
  } else {
    head = mesh(
      new THREE.SphereGeometry(0.68, 36, 24),
      material(palette.primary, id === "avatar-yeti" ? 0.95 : 0.52, 0.08),
    );
    if (id === "avatar-hibou") {
      head.scale.set(1.16, 0.94, 0.98);
    }
    if (id === "avatar-yeti") {
      head.scale.set(1.14, 1.04, 1.02);
    }
  }

  head.position.y = 0.68;
  add(head, headGroup);

  addFace(avatar, palette, headGroup);
  return headGroup;
}

// Traits distinctifs de chaque silhouette (oreilles, cornes, visière, etc.).
function addFace(avatar: PublicAvatar, palette: Palette, group: THREE.Group) {
  const id = avatar.avatarId;

  if (id === "avatar-robot") {
    const visor = mesh(
      new THREE.BoxGeometry(0.8, 0.28, 0.1),
      new THREE.MeshStandardMaterial({ color: DARK, metalness: 0.55, roughness: 0.22 }),
    );
    visor.position.set(0, 0.74, 0.5);
    add(visor, group);
    const glow = new THREE.MeshStandardMaterial({
      color: palette.accent,
      emissive: palette.accent,
      emissiveIntensity: 0.85,
      roughness: 0.35,
    });
    [-0.18, 0.18].forEach((x) => {
      const eye = mesh(new THREE.BoxGeometry(0.14, 0.08, 0.05), glow);
      eye.position.set(x, 0.74, 0.56);
      add(eye, group);
    });
    const mouth = mesh(new THREE.BoxGeometry(0.34, 0.06, 0.05), material(palette.secondary, 0.4, 0.35));
    mouth.position.set(0, 0.46, 0.52);
    add(mouth, group);
    const stalk = mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10),
      material(palette.secondary, 0.4, 0.4),
    );
    stalk.position.set(0, 1.3, 0);
    add(stalk, group);
    const bulb = mesh(
      new THREE.SphereGeometry(0.09, 16, 12),
      new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 1.1,
        roughness: 0.3,
      }),
    );
    bulb.position.set(0, 1.5, 0);
    add(bulb, group);
    return;
  }

  if (id === "avatar-astronaute") {
    const visor = mesh(
      new THREE.SphereGeometry(0.46, 28, 20),
      new THREE.MeshStandardMaterial({
        color: DARK,
        emissive: palette.primary,
        emissiveIntensity: 0.22,
        metalness: 0.9,
        roughness: 0.08,
      }),
    );
    visor.position.set(0, 0.72, 0.34);
    visor.scale.set(1.15, 0.92, 0.7);
    add(visor, group);
    const rim = mesh(new THREE.TorusGeometry(0.44, 0.05, 12, 40), material(palette.secondary, 0.35, 0.5));
    rim.position.set(0, 0.72, 0.36);
    rim.scale.set(1.15, 0.92, 0.7);
    add(rim, group);
    const shine = mesh(
      new THREE.SphereGeometry(0.12, 16, 10),
      new THREE.MeshStandardMaterial({
        color: palette.secondary,
        opacity: 0.7,
        roughness: 0.1,
        transparent: true,
      }),
    );
    shine.position.set(-0.16, 0.86, 0.62);
    shine.scale.set(1.4, 0.7, 0.3);
    add(shine, group);
    return;
  }

  if (id === "avatar-hibou") {
    const white = material(palette.secondary, 0.4, 0.04);
    const pupil = material(palette.accent, 0.3, 0.05);
    [-0.26, 0.26].forEach((x) => {
      const eye = mesh(new THREE.SphereGeometry(0.24, 20, 16), white);
      eye.position.set(x, 0.76, 0.46);
      eye.scale.set(1, 1, 0.7);
      add(eye, group);
      const dot = mesh(new THREE.SphereGeometry(0.1, 16, 12), pupil);
      dot.position.set(x, 0.76, 0.64);
      add(dot, group);
    });
    const beak = mesh(new THREE.ConeGeometry(0.12, 0.26, 4), material(palette.accent, 0.45, 0.1));
    beak.position.set(0, 0.56, 0.66);
    beak.rotation.x = Math.PI / 2;
    add(beak, group);
    return;
  }

  if (id === "avatar-renard") {
    const earMaterial = material(palette.primary, 0.5, 0.08);
    const innerMaterial = material(palette.accent, 0.5, 0.05);
    [-1, 1].forEach((s) => {
      const ear = mesh(new THREE.ConeGeometry(0.2, 0.46, 4), earMaterial);
      ear.position.set(0.4 * s, 1.28, -0.02);
      ear.rotation.z = -0.28 * s;
      add(ear, group);
      const tip = mesh(new THREE.ConeGeometry(0.1, 0.24, 4), innerMaterial);
      tip.position.set(0.4 * s, 1.34, 0.04);
      tip.rotation.z = -0.28 * s;
      add(tip, group);
    });
    const muzzle = mesh(new THREE.SphereGeometry(0.24, 20, 16), material(palette.secondary, 0.5, 0.05));
    muzzle.position.set(0, 0.5, 0.58);
    muzzle.scale.set(1.1, 0.82, 0.85);
    add(muzzle, group);
    const nose = mesh(new THREE.SphereGeometry(0.08, 14, 10), material(palette.accent, 0.4, 0.1));
    nose.position.set(0, 0.55, 0.82);
    add(nose, group);
    addEyes(group, palette.accent, 0.076, 0.8, 0.58, 0.21);
    return;
  }

  if (id === "avatar-dragon") {
    const hornMaterial = material(palette.secondary, 0.45, 0.1);
    [-1, 1].forEach((s) => {
      const horn = mesh(new THREE.ConeGeometry(0.1, 0.5, 4), hornMaterial);
      horn.position.set(0.28 * s, 1.24, -0.14);
      horn.rotation.set(-0.55, 0, -0.18 * s);
      add(horn, group);
    });
    const snout = mesh(new THREE.ConeGeometry(0.3, 0.52, 4), material(palette.primary, 0.5, 0.12));
    snout.position.set(0, 0.5, 0.5);
    snout.rotation.x = Math.PI / 2;
    add(snout, group);
    const nostrilMaterial = material(DARK, 0.5, 0.05);
    [-0.09, 0.09].forEach((x) => {
      const nostril = mesh(new THREE.SphereGeometry(0.04, 10, 8), nostrilMaterial);
      nostril.position.set(x, 0.5, 0.86);
      add(nostril, group);
    });
    addEyes(group, palette.accent, 0.08, 0.86, 0.48, 0.24);
    return;
  }

  if (id === "avatar-yeti") {
    addEyes(group, DARK, 0.08, 0.74, 0.58, 0.2);
    const browMaterial = material(palette.accent, 0.7, 0.05);
    [-1, 1].forEach((s) => {
      const brow = mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), browMaterial);
      brow.position.set(0.2 * s, 0.9, 0.56);
      brow.rotation.z = 0.16 * s;
      add(brow, group);
    });
    const mouth = mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), material(DARK, 0.5, 0.02));
    mouth.position.set(0, 0.5, 0.64);
    add(mouth, group);
    return;
  }

  if (id === "avatar-fantome") {
    addEyes(group, DARK, 0.1, 0.78, 0.56, 0.2);
    const mouth = mesh(new THREE.SphereGeometry(0.09, 14, 12), material(DARK, 0.4, 0.02));
    mouth.position.set(0, 0.52, 0.6);
    mouth.scale.set(0.8, 1.1, 0.6);
    add(mouth, group);
    return;
  }

  if (id === "avatar-abeille") {
    addEyes(group, DARK, 0.085, 0.76, 0.58, 0.2);
    const antennaMaterial = material(DARK, 0.5, 0.1);
    const bulbMaterial = material(palette.accent, 0.4, 0.1);
    [-1, 1].forEach((s) => {
      const stalk = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), antennaMaterial);
      stalk.position.set(0.13 * s, 1.14, 0.05);
      stalk.rotation.z = -0.35 * s;
      add(stalk, group);
      const bulb = mesh(new THREE.SphereGeometry(0.06, 12, 10), bulbMaterial);
      bulb.position.set(0.22 * s, 1.3, 0.05);
      add(bulb, group);
    });
    const smile = mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), material(DARK, 0.5, 0.02));
    smile.position.set(0, 0.52, 0.64);
    add(smile, group);
    return;
  }

  if (id === "avatar-panda") {
    const black = material(palette.secondary, 0.5, 0.04);
    // Oreilles rondes noires posées sur le dessus de la tête.
    [-1, 1].forEach((s) => {
      const ear = mesh(new THREE.SphereGeometry(0.2, 20, 16), black);
      ear.position.set(0.44 * s, 1.2, -0.04);
      ear.scale.set(1, 1, 0.7);
      add(ear, group);
    });
    // Taches oculaires noires aplaties et inclinées, avec pupilles claires.
    const pupilMaterial = material(palette.primary, 0.4, 0.05);
    [-1, 1].forEach((s) => {
      const patch = mesh(new THREE.SphereGeometry(0.17, 20, 16), black);
      patch.position.set(0.25 * s, 0.76, 0.5);
      patch.scale.set(0.78, 1.15, 0.5);
      patch.rotation.z = 0.32 * s;
      add(patch, group);
      const pupil = mesh(new THREE.SphereGeometry(0.06, 14, 12), pupilMaterial);
      pupil.position.set(0.25 * s, 0.74, 0.64);
      add(pupil, group);
    });
    // Petit museau sombre.
    const nose = mesh(new THREE.SphereGeometry(0.08, 14, 12), black);
    nose.position.set(0, 0.56, 0.66);
    nose.scale.set(1.2, 0.8, 0.9);
    add(nose, group);
    return;
  }

  if (id === "avatar-citrouille") {
    // Côtes suggérées : fins tores verticaux (méridiens) de la même teinte.
    const ribMaterial = material(palette.primary, 0.6, 0.05);
    [-0.62, 0, 0.62].forEach((angle) => {
      const rib = mesh(new THREE.TorusGeometry(0.72, 0.045, 10, 28), ribMaterial);
      rib.position.set(0, 0.68, 0);
      rib.rotation.y = angle;
      rib.scale.set(1.14, 0.86, 1.14);
      add(rib, group);
    });
    // Tige verte inclinée sur le dessus.
    const stem = mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.26, 8),
      material(palette.accent, 0.6, 0.05),
    );
    stem.position.set(0.05, 1.28, 0);
    stem.rotation.z = -0.24;
    add(stem, group);
    // Yeux triangulaires sombres + large rictus.
    const jack = material(palette.secondary, 0.5, 0.04);
    [-1, 1].forEach((s) => {
      const eye = mesh(new THREE.ConeGeometry(0.15, 0.16, 3), jack);
      eye.position.set(0.24 * s, 0.82, 0.7);
      eye.rotation.x = -Math.PI / 2;
      add(eye, group);
    });
    const mouth = mesh(new THREE.BoxGeometry(0.44, 0.1, 0.1), jack);
    mouth.position.set(0, 0.5, 0.72);
    add(mouth, group);
    return;
  }

  if (id === "avatar-grenouille") {
    // Deux yeux globuleux proéminents sur le dessus de la tête.
    const eyeball = material(palette.secondary, 0.4, 0.05);
    const pupil = material(DARK, 0.35, 0.05);
    [-1, 1].forEach((s) => {
      const globe = mesh(new THREE.SphereGeometry(0.2, 20, 16), eyeball);
      globe.position.set(0.26 * s, 1.18, 0.16);
      add(globe, group);
      const dot = mesh(new THREE.SphereGeometry(0.09, 14, 12), pupil);
      dot.position.set(0.26 * s, 1.22, 0.32);
      add(dot, group);
    });
    // Large sourire fin : arc torique courbé vers le bas.
    const smile = mesh(
      new THREE.TorusGeometry(0.28, 0.028, 10, 24, Math.PI),
      material(palette.accent, 0.5, 0.04),
    );
    smile.position.set(0, 0.58, 0.58);
    smile.rotation.z = Math.PI;
    add(smile, group);
    return;
  }

  if (id === "avatar-requin") {
    // Aileron dorsal : cône aplati (mince dans l'axe X) légèrement incliné vers l'arrière.
    const fin = mesh(new THREE.ConeGeometry(0.26, 0.5, 4), material(palette.primary, 0.5, 0.1));
    fin.position.set(0, 1.28, -0.06);
    fin.rotation.x = -0.22;
    fin.scale.set(0.38, 1, 1.05);
    add(fin, group);
    // Mâchoire claire sous le museau.
    const jaw = mesh(new THREE.SphereGeometry(0.3, 20, 16), material(palette.secondary, 0.5, 0.05));
    jaw.position.set(0, 0.48, 0.52);
    jaw.scale.set(1.05, 0.5, 1);
    add(jaw, group);
    // Petite rangée de dents : cônes blancs pointant vers le bas.
    const toothMaterial = material(palette.secondary, 0.35, 0.04);
    [-0.18, -0.06, 0.06, 0.18].forEach((x) => {
      const tooth = mesh(new THREE.ConeGeometry(0.045, 0.13, 4), toothMaterial);
      tooth.position.set(x, 0.4, 0.68);
      tooth.rotation.x = Math.PI;
      add(tooth, group);
    });
    // Yeux sombres latéraux.
    addEyes(group, DARK, 0.075, 0.82, 0.46, 0.4);
    return;
  }

  if (id === "avatar-tigre") {
    const stripeMaterial = material(palette.accent, 0.5, 0.05);
    [-0.28, 0, 0.28].forEach((x, index) => {
      const stripe = mesh(new THREE.BoxGeometry(0.08, 0.34 - index * 0.06, 0.05), stripeMaterial);
      stripe.position.set(x, 1.02 - Math.abs(x) * 0.25, 0.6);
      stripe.rotation.z = x * 0.9;
      add(stripe, group);
    });
    [-1, 1].forEach((s) => {
      const ear = mesh(new THREE.ConeGeometry(0.18, 0.36, 4), material(palette.primary, 0.5, 0.08));
      ear.position.set(0.42 * s, 1.22, -0.02);
      ear.rotation.z = -0.24 * s;
      add(ear, group);
    });
    const muzzle = mesh(new THREE.SphereGeometry(0.23, 20, 16), material(palette.secondary, 0.5, 0.04));
    muzzle.position.set(0, 0.52, 0.6);
    muzzle.scale.set(1.2, 0.8, 0.8);
    add(muzzle, group);
    addEyes(group, DARK, 0.075, 0.78, 0.6, 0.22);
    return;
  }

  if (id === "avatar-licorne") {
    const horn = mesh(new THREE.ConeGeometry(0.12, 0.58, 6), material(palette.accent, 0.36, 0.18));
    horn.position.set(0, 1.36, 0.12);
    horn.rotation.x = -0.22;
    add(horn, group);
    [-1, 1].forEach((s) => {
      const ear = mesh(new THREE.ConeGeometry(0.14, 0.34, 4), material(palette.secondary, 0.45, 0.05));
      ear.position.set(0.36 * s, 1.22, -0.02);
      ear.rotation.z = -0.28 * s;
      add(ear, group);
    });
    const forelock = mesh(new THREE.SphereGeometry(0.16, 16, 12), material(palette.accent, 0.42, 0.08));
    forelock.position.set(-0.16, 1.1, 0.45);
    forelock.scale.set(0.9, 1.35, 0.55);
    add(forelock, group);
    const muzzle = mesh(new THREE.SphereGeometry(0.22, 20, 16), material(palette.secondary, 0.45, 0.04));
    muzzle.position.set(0, 0.5, 0.62);
    muzzle.scale.set(1.15, 0.82, 0.75);
    add(muzzle, group);
    addEyes(group, palette.accent, 0.075, 0.78, 0.58, 0.22);
    return;
  }

  // avatar-classic-3d, avatar-slime et repli : yeux + sourire + reflet.
  addEyes(group, palette.accent, 0.075, 0.73, 0.62, 0.23);
  const mouth = mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), material(palette.accent, 0.5, 0.02));
  mouth.position.set(0.1, 0.46, 0.66);
  mouth.rotation.z = -0.05;
  add(mouth, group);
  const shine = mesh(
    new THREE.SphereGeometry(0.13, 16, 10),
    new THREE.MeshStandardMaterial({
      color: palette.secondary,
      metalness: 0.02,
      opacity: 0.58,
      roughness: 0.18,
      transparent: true,
    }),
  );
  shine.position.set(-0.27, 0.94, 0.56);
  shine.scale.set(1.5, 0.54, 0.24);
  add(shine, group);
}

// Corps de l'avatar : torse classique, sauf le fantôme (base ondulée) et les
// variantes rayées/ventrues.
function buildBody(avatar: PublicAvatar, palette: Palette, group: THREE.Group) {
  const id = avatar.avatarId;

  if (id === "avatar-fantome") {
    const base = mesh(new THREE.SphereGeometry(0.5, 28, 20), glassy(palette.primary, 0.62, 0.22));
    base.position.set(0, -0.05, 0);
    base.scale.set(1.2, 1.25, 1);
    add(base, group);
    [-0.34, -0.11, 0.12, 0.35].forEach((x) => {
      const drip = mesh(new THREE.SphereGeometry(0.18, 18, 14), glassy(palette.primary, 0.58, 0.22));
      drip.position.set(x, -0.62, 0.02);
      drip.scale.set(1, 0.9, 1);
      add(drip, group);
    });
    return;
  }

  const torso = mesh(new THREE.CapsuleGeometry(0.48, 0.48, 12, 28), material(palette.shirt, 0.48, 0.1));
  torso.position.set(0, -0.25, 0);
  torso.scale.set(1.02, 0.94, 0.72);
  add(torso, group);

  const chest = mesh(new THREE.SphereGeometry(0.16, 18, 12), material(palette.shirtAccent, 0.42, 0.12));
  chest.position.set(0, -0.12, 0.48);
  chest.scale.set(1.5, 0.55, 0.25);
  add(chest, group);

  if (id === "avatar-abeille") {
    // Abdomen rayé jaune (primary) / noir (accent), autoportant quel que soit le t-shirt.
    [0.02, -0.16, -0.34, -0.52].forEach((y, index) => {
      const color = index % 2 === 0 ? palette.accent : palette.primary;
      const stripe = mesh(new THREE.TorusGeometry(0.46, 0.07, 10, 32), material(color, 0.5, 0.06));
      stripe.position.set(0, y, 0);
      stripe.rotation.x = Math.PI / 2;
      stripe.scale.set(1.02, 1, 0.74);
      add(stripe, group);
    });
  }

  if (id === "avatar-yeti") {
    const belly = mesh(new THREE.SphereGeometry(0.3, 20, 16), material(palette.secondary, 0.85, 0.02));
    belly.position.set(0, -0.28, 0.4);
    belly.scale.set(1.1, 1.2, 0.5);
    add(belly, group);
  }

  if (id === "avatar-grenouille") {
    // Ventre clair de grenouille.
    const belly = mesh(new THREE.SphereGeometry(0.3, 20, 16), material(palette.secondary, 0.5, 0.04));
    belly.position.set(0, -0.26, 0.42);
    belly.scale.set(1.15, 1.25, 0.5);
    add(belly, group);
  }

  if (id === "avatar-requin") {
    // Ventre clair de requin.
    const belly = mesh(new THREE.SphereGeometry(0.3, 20, 16), material(palette.secondary, 0.5, 0.05));
    belly.position.set(0, -0.28, 0.42);
    belly.scale.set(1.1, 1.3, 0.5);
    add(belly, group);
  }
}

function addLimbs(avatar: PublicAvatar, palette: Palette, group: THREE.Group) {
  if (avatar.avatarId === "avatar-fantome") {
    return;
  }

  const armMaterial = avatar.avatarId === "avatar-robot"
    ? material(palette.primary, 0.38, 0.32)
    : material(palette.shirt, 0.5, 0.08);
  const footMaterial = material(palette.shirtAccent, 0.44, 0.12);

  [-1, 1].forEach((s) => {
    const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.48, 8, 14), armMaterial);
    arm.position.set(0.53 * s, -0.24, 0.02);
    arm.rotation.z = -0.38 * s;
    add(arm, group);

    const hand = mesh(new THREE.SphereGeometry(0.11, 16, 12), material(palette.primary, 0.52, 0.06));
    hand.position.set(0.66 * s, -0.52, 0.12);
    hand.scale.set(1, 0.9, 0.85);
    add(hand, group);

    const foot = mesh(new THREE.SphereGeometry(0.14, 16, 12), footMaterial);
    foot.position.set(0.24 * s, -0.78, 0.18);
    foot.scale.set(1.35, 0.45, 0.9);
    add(foot, group);
  });
}

function addHat(avatar: PublicAvatar, palette: Palette, group: THREE.Group) {
  if (!avatar.hatId || avatar.hatId === "hat-casquette") {
    return;
  }

  const hatMaterial = material(palette.hat, 0.44, 0.12);
  const accentMaterial = material(palette.hatAccent, 0.36, 0.18);

  if (avatar.hatId === "hat-couronne-lowpoly") {
    const base = mesh(new THREE.CylinderGeometry(0.47, 0.52, 0.18, 6), hatMaterial);
    base.position.set(0, 1.35, 0.02);
    add(base, group);
    [-0.32, 0, 0.32].forEach((x, index) => {
      const spike = mesh(new THREE.ConeGeometry(0.16, 0.34, 4), hatMaterial);
      spike.position.set(x, 1.58 + (index === 1 ? 0.06 : 0), 0.02);
      spike.rotation.y = Math.PI / 4;
      add(spike, group);
    });
    return;
  }

  if (avatar.hatId === "hat-casque-spatial") {
    const helmet = mesh(
      new THREE.SphereGeometry(0.86, 36, 24),
      new THREE.MeshPhysicalMaterial({
        color: palette.hat,
        metalness: 0.02,
        opacity: 0.28,
        roughness: 0.06,
        transmission: 0.2,
        transparent: true,
      }),
    );
    helmet.position.set(0, 0.7, 0.02);
    add(helmet, group);
    const rim = mesh(new THREE.TorusGeometry(0.68, 0.035, 12, 64), accentMaterial);
    rim.position.set(0, 0.34, 0.28);
    rim.rotation.x = Math.PI / 2;
    add(rim, group);
    return;
  }

  if (avatar.hatId === "hat-halo") {
    const halo = mesh(new THREE.TorusGeometry(0.58, 0.035, 12, 80), accentMaterial);
    halo.position.set(0, 1.58, -0.02);
    halo.rotation.x = Math.PI / 2.3;
    add(halo, group);
    return;
  }

  if (avatar.hatId === "hat-sorcier") {
    const brim = mesh(new THREE.TorusGeometry(0.6, 0.08, 12, 40), accentMaterial);
    brim.position.set(0, 1.3, 0);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1, 1, 0.55);
    add(brim, group);
    const cone = mesh(new THREE.ConeGeometry(0.5, 1.1, 20), hatMaterial);
    cone.position.set(0, 1.86, 0);
    cone.rotation.z = 0.12;
    add(cone, group);
    const star = mesh(
      new THREE.SphereGeometry(0.08, 12, 10),
      new THREE.MeshStandardMaterial({
        color: palette.hatAccent,
        emissive: palette.hatAccent,
        emissiveIntensity: 0.7,
        roughness: 0.3,
      }),
    );
    star.position.set(0.16, 2, 0.36);
    add(star, group);
    return;
  }

  if (avatar.hatId === "hat-viking") {
    const cap = mesh(
      new THREE.SphereGeometry(0.56, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      hatMaterial,
    );
    cap.position.set(0, 1.28, 0);
    add(cap, group);
    const band = mesh(new THREE.TorusGeometry(0.54, 0.05, 12, 40), accentMaterial);
    band.position.set(0, 1.28, 0);
    band.rotation.x = Math.PI / 2;
    add(band, group);
    const hornMaterial = material(palette.hatAccent, 0.4, 0.15);
    [-1, 1].forEach((s) => {
      const horn = mesh(new THREE.ConeGeometry(0.11, 0.5, 12), hornMaterial);
      horn.position.set(0.52 * s, 1.42, 0);
      horn.rotation.z = 0.7 * s;
      add(horn, group);
    });
    return;
  }

  if (avatar.hatId === "hat-melon") {
    // Calotte demi-sphère (la bombe du melon).
    const dome = mesh(
      new THREE.SphereGeometry(0.5, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      hatMaterial,
    );
    dome.position.set(0, 1.18, 0);
    dome.scale.set(1, 0.9, 1);
    add(dome, group);
    // Bord torique horizontal.
    const brim = mesh(new THREE.TorusGeometry(0.52, 0.08, 12, 40), hatMaterial);
    brim.position.set(0, 1.18, 0);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1, 1, 0.85);
    add(brim, group);
    // Petite bande claire à la base de la calotte.
    const band = mesh(new THREE.TorusGeometry(0.47, 0.03, 10, 40), accentMaterial);
    band.position.set(0, 1.24, 0);
    band.rotation.x = Math.PI / 2;
    add(band, group);
    return;
  }

  if (avatar.hatId === "hat-pirate") {
    // Large bord torique aplati et allongé (tricorne relevé).
    const brim = mesh(new THREE.TorusGeometry(0.6, 0.11, 12, 44), hatMaterial);
    brim.position.set(0, 1.22, 0);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.18, 1, 0.42);
    add(brim, group);
    // Liseré doré courant le long du bord.
    const trim = mesh(new THREE.TorusGeometry(0.6, 0.03, 10, 44), accentMaterial);
    trim.position.set(0, 1.26, 0);
    trim.rotation.x = Math.PI / 2;
    trim.scale.set(1.18, 1, 0.42);
    add(trim, group);
    // Calotte basse.
    const crown = mesh(
      new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      hatMaterial,
    );
    crown.position.set(0, 1.22, 0);
    crown.scale.set(1, 0.7, 1);
    add(crown, group);
    // Petit médaillon clair à l'avant.
    const badge = mesh(
      new THREE.SphereGeometry(0.09, 16, 12),
      material(palette.hatAccent, 0.4, 0.2),
    );
    badge.position.set(0, 1.34, 0.4);
    badge.scale.set(1, 1, 0.5);
    add(badge, group);
    return;
  }

  if (avatar.hatId === "hat-cowboy") {
    // Calotte bombée haute.
    const crown = mesh(
      new THREE.SphereGeometry(0.42, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      hatMaterial,
    );
    crown.position.set(0, 1.22, 0);
    crown.scale.set(1, 1.18, 1);
    add(crown, group);
    // Très large bord torique aplati, bords légèrement relevés (léger volume vertical).
    const brim = mesh(new THREE.TorusGeometry(0.66, 0.12, 12, 44), hatMaterial);
    brim.position.set(0, 1.2, 0);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.32, 1.32, 0.42);
    add(brim, group);
    // Bande sombre à la base de la calotte.
    const band = mesh(new THREE.TorusGeometry(0.4, 0.05, 10, 40), accentMaterial);
    band.position.set(0, 1.28, 0);
    band.rotation.x = Math.PI / 2;
    add(band, group);
    return;
  }

  if (avatar.hatId === "hat-noel") {
    // Bande blanche torique à la base.
    const band = mesh(
      new THREE.TorusGeometry(0.44, 0.09, 12, 40),
      material(palette.hatSecondary, 0.5, 0.04),
    );
    band.position.set(0, 1.22, 0);
    band.rotation.x = Math.PI / 2;
    add(band, group);
    // Cône rouge souple en deux segments : base droite puis pointe qui retombe.
    const lower = mesh(new THREE.ConeGeometry(0.42, 0.72, 20), hatMaterial);
    lower.position.set(0, 1.62, 0);
    add(lower, group);
    const tip = mesh(new THREE.ConeGeometry(0.2, 0.52, 18), hatMaterial);
    tip.position.set(0.26, 1.94, 0.02);
    tip.rotation.z = -0.95;
    add(tip, group);
    // Pompon blanc à la pointe.
    const pompom = mesh(
      new THREE.SphereGeometry(0.13, 16, 12),
      material(palette.hatSecondary, 0.5, 0.04),
    );
    pompom.position.set(0.52, 2, 0.02);
    add(pompom, group);
    return;
  }

  if (avatar.hatId === "hat-ninja") {
    const band = mesh(new THREE.BoxGeometry(0.88, 0.13, 0.16), hatMaterial);
    band.position.set(0, 0.98, 0.55);
    add(band, group);
    [-1, 1].forEach((s) => {
      const tail = mesh(new THREE.BoxGeometry(0.28, 0.09, 0.05), accentMaterial);
      tail.position.set(0.5 * s, 0.96, 0.44);
      tail.rotation.z = 0.45 * s;
      add(tail, group);
    });
    return;
  }

  if (avatar.hatId === "hat-beret") {
    const beret = mesh(new THREE.SphereGeometry(0.48, 24, 14), hatMaterial);
    beret.position.set(-0.1, 1.22, 0.02);
    beret.scale.set(1.25, 0.28, 0.92);
    add(beret, group);
    const nub = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), accentMaterial);
    nub.position.set(-0.18, 1.35, 0.02);
    add(nub, group);
    return;
  }

  if (avatar.hatId === "hat-detective") {
    const brim = mesh(new THREE.TorusGeometry(0.58, 0.08, 12, 42), hatMaterial);
    brim.position.set(0, 1.2, 0);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.18, 1.02, 0.48);
    add(brim, group);
    const crown = mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.42, 18), hatMaterial);
    crown.position.set(0, 1.42, 0);
    add(crown, group);
    const band = mesh(new THREE.TorusGeometry(0.39, 0.035, 10, 36), accentMaterial);
    band.position.set(0, 1.32, 0);
    band.rotation.x = Math.PI / 2;
    add(band, group);
    return;
  }

  // hat-bonnet-pixel (repli) : calotte + bord.
  const cap = mesh(new THREE.SphereGeometry(0.5, 24, 14), hatMaterial);
  cap.position.set(0, 1.18, 0.02);
  cap.scale.set(1.08, 0.36, 0.92);
  add(cap, group);

  const brim = mesh(new THREE.BoxGeometry(0.58, 0.09, 0.28), accentMaterial);
  brim.position.set(0.15, 1.06, 0.55);
  brim.rotation.x = -0.1;
  add(brim, group);
}

function buildScene(avatar: PublicAvatar) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.55, 5.4);

  const group = new THREE.Group();
  scene.add(group);
  const palette = paletteFromAvatar(avatar);

  buildBody(avatar, palette, group);
  addLimbs(avatar, palette, group);
  add(buildHead(avatar, palette), group);
  addHat(avatar, palette, group);

  const floor = mesh(
    new THREE.CircleGeometry(1.2, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.13, transparent: true }),
  );
  floor.position.set(0, -0.92, -0.28);
  floor.scale.set(1, 0.28, 1);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x58606d, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(2.8, 3.4, 4.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(palette.accent, 1.25);
  rim.position.set(-3, 1.2, 2.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.65);
  fill.position.set(-2.4, 1.6, 3.2);
  scene.add(fill);

  return { camera, group, scene };
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((item) => item.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
}

// Pattern "multiple scenes, un seul renderer" recommandé par three.js : un seul
// contexte WebGL partagé pour toutes les instances (les navigateurs plafonnent à
// ~8-16 contextes, or la boutique et le classement en montent des dizaines). On
// rend chaque scène tour à tour dans un canvas hors DOM puis on recopie l'image
// dans le canvas 2D de chaque instance.
type Instance = {
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  group: THREE.Group;
  rendered: boolean;
  scene: THREE.Scene;
  visible: boolean;
};

const registry = new Set<Instance>();
const rendererSize = { h: 0, w: 0 };
let sharedRenderer: THREE.WebGLRenderer | null = null;
let frame = 0;

// L'oscillation des avatars est purement décorative : on la fige pour les
// utilisateurs qui demandent moins d'animations.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getRenderer(): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    const canvas = document.createElement("canvas");
    sharedRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
    sharedRenderer.setClearColor(0x000000, 0);
    sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return sharedRenderer;
}

function renderInstance(instance: Instance, time: number): boolean {
  const { canvas } = instance;
  const cssWidth = Math.floor(canvas.clientWidth);
  const cssHeight = Math.floor(canvas.clientHeight);
  if (cssWidth <= 0 || cssHeight <= 0) {
    return false;
  }

  if (reducedMotion.matches) {
    instance.group.rotation.set(0, -0.35, 0);
  } else {
    instance.group.rotation.y = -0.35 + Math.sin(time * 0.75) * 0.12;
    instance.group.rotation.x = Math.sin(time * 0.55) * 0.025;
  }

  const renderer = getRenderer();
  if (rendererSize.w !== cssWidth || rendererSize.h !== cssHeight) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(cssWidth, cssHeight, false);
    rendererSize.w = cssWidth;
    rendererSize.h = cssHeight;
  }

  const bufferWidth = renderer.domElement.width;
  const bufferHeight = renderer.domElement.height;
  const aspect = cssWidth / cssHeight;
  if (instance.camera.aspect !== aspect) {
    instance.camera.aspect = aspect;
    instance.camera.updateProjectionMatrix();
  }

  renderer.render(instance.scene, instance.camera);

  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
  }
  instance.ctx.clearRect(0, 0, bufferWidth, bufferHeight);
  instance.ctx.drawImage(renderer.domElement, 0, 0, bufferWidth, bufferHeight);
  return true;
}

function loop() {
  const time = performance.now() / 1000;
  const reduced = reducedMotion.matches;
  // En mouvement réduit les scènes sont statiques : chaque instance n'est
  // dessinée qu'une fois, puis la boucle se suspend (l'IntersectionObserver et
  // les montages la relancent au besoin).
  const pending = [...registry].filter(
    (instance) => instance.visible && (!reduced || !instance.rendered),
  );

  if (reduced && pending.length === 0) {
    frame = 0;
    return;
  }

  // Trié par taille : le renderer partagé n'est redimensionné qu'une fois par
  // taille distincte et par frame, au lieu d'une fois par alternance de tailles.
  pending.sort((a, b) => a.canvas.clientHeight - b.canvas.clientHeight);
  for (const instance of pending) {
    if (renderInstance(instance, time)) {
      instance.rendered = true;
    }
  }

  frame = window.requestAnimationFrame(loop);
}

function startLoop() {
  if (!frame) {
    frame = window.requestAnimationFrame(loop);
  }
}

function stopLoop() {
  if (frame) {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
}

function createInstance(canvas: HTMLCanvasElement, avatar: PublicAvatar) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return () => {};
  }

  const { camera, group, scene } = buildScene(avatar);
  const instance: Instance = {
    camera,
    canvas,
    ctx,
    group,
    rendered: false,
    scene,
    visible: true,
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        instance.visible = entry.isIntersecting;
        if (entry.isIntersecting) {
          instance.rendered = false;
          startLoop();
        }
      }
    },
    { rootMargin: "120px" },
  );
  observer.observe(canvas);

  registry.add(instance);
  startLoop();

  return () => {
    observer.disconnect();
    registry.delete(instance);
    if (registry.size === 0) {
      stopLoop();
    }
    disposeScene(scene);
  };
}

export function AvatarDisplay({
  avatar = DEFAULT_PUBLIC_AVATAR,
  className,
  label,
  rank,
  size = "md",
}: {
  avatar?: PublicAvatar;
  className?: string;
  label?: string;
  rank?: number;
  size?: AvatarDisplaySize;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // La scène ne dépend que de ces quatre champs : les pages recréent souvent
  // l'objet avatar à chaque render, on ne reconstruit donc pas la scène tant
  // que les valeurs n'ont pas changé (référence ≠ contenu).
  const sceneKey = `${avatar.avatarId}|${avatar.hatId ?? ""}|${avatar.shirtId}`;
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    return createInstance(canvas, avatarRef.current);
  }, [sceneKey]);

  return (
    <div
      aria-label={label}
      className={cn("smotu-avatar", SIZE_CLASS[size], className)}
      role={label ? "img" : undefined}
    >
      <div className="smotu-avatar__canvas">
        <canvas ref={canvasRef} />
      </div>
      {typeof rank === "number" ? (
        <span className="smotu-avatar__rank">{rank}</span>
      ) : null}
    </div>
  );
}

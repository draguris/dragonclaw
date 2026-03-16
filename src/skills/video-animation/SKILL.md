---
name: video-animation
description: Build agency-quality animated videos (motion graphics, brand showcases, product reveals) using the video-js artifact type with React, Framer Motion, and Tailwind. Use when the user asks to create an animation, showcase video, motion graphic, or brand film.
---

# Video Animation Skill

Build smooth, cinematic motion graphics for any brand or product. This skill covers the full workflow from setup to scene authoring — brand-agnostic and reusable for any project.

---

## Setup

### 1. Create the artifact

```javascript
const result = await createArtifact({
  artifactType: "video-js",
  slug: "my-video",
  previewPath: "/",
  title: "My Brand Showcase"
});
```

### 2. Define your brand system in `index.css`

Replace the placeholder values with your actual brand. This is the only place brand colors and fonts are defined — all scenes reference these variables.

```css
/* index.css */
:root {
  /* --- YOUR BRAND COLORS --- */
  --color-primary: #YOUR_PRIMARY;      /* main brand color, CTAs, accents */
  --color-secondary: #YOUR_SECONDARY;  /* secondary accent */
  --color-bg-dark: #YOUR_BG;           /* scene background */

  --color-text-primary: #ffffff;
  --color-text-secondary: #aaaaaa;
  --color-text-muted: #666666;

  /* --- YOUR BRAND FONTS --- */
  --font-display: 'YourDisplayFont', sans-serif;  /* titles, headings */
  --font-body: 'YourBodyFont', sans-serif;         /* body, labels */
}
```

### 3. Load fonts in `index.html`

```html
<link href="https://fonts.googleapis.com/css2?family=YourDisplayFont&family=YourBodyFont&display=swap" rel="stylesheet">
```

**Font selection by brand personality:**
| Mood | Display font | Body font |
|---|---|---|
| Tech/Developer | Space Grotesk | JetBrains Mono |
| Bold/Energy | Bungee or Anton | DM Sans |
| Premium/Luxury | Cormorant Garamond | Inter |
| Playful | Nunito | Baloo 2 |
| Editorial | Fraunces | IBM Plex Sans |

---

## File Structure

Every video follows this layout inside `artifacts/<slug>/src/`:

```
components/video/
├── VideoTemplate.tsx       ← scene orchestrator + timing
├── PersistentLayers.tsx    ← background, shapes, accents (OUTSIDE AnimatePresence)
├── Scene1<Name>.tsx
├── Scene2<Name>.tsx
└── Scene3<Name>.tsx        ← as many scenes as needed
lib/video/
├── hooks.ts                ← useVideoPlayer (auto-advances scenes, loops)
└── animations.ts           ← spring/easing presets
```

---

## VideoTemplate.tsx — Scene Orchestrator

```tsx
import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { PersistentLayers } from './PersistentLayers';
import { Scene1Intro } from './Scene1Intro';
import { Scene2Features } from './Scene2Features';
import { Scene3Lockup } from './Scene3Lockup';

// Durations in milliseconds. Mix short punchy beats with longer dramatic holds.
const SCENE_DURATIONS = {
  intro:    4000,   // brand reveal — let it breathe
  features: 5000,   // staggered content — needs reading time
  lockup:   6000,   // final impression — hold it longer
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[var(--color-bg-dark)]">
      {/* Persistent background — lives OUTSIDE AnimatePresence */}
      <PersistentLayers currentScene={currentScene} />

      {/* Scenes swap in/out with AnimatePresence */}
      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Intro key="intro" />}
        {currentScene === 1 && <Scene2Features key="features" />}
        {currentScene === 2 && <Scene3Lockup key="lockup" />}
      </AnimatePresence>
    </div>
  );
}
```

**Timing rules:**
- First scene: 3–4s (brand reveal needs to land)
- Feature/content scenes: 4–6s (staggered lists need time)
- Final scene: 5–7s (leave impression before loop)
- Never make every scene the same duration — rhythm dies

---

## PersistentLayers.tsx — Continuous Background

Elements here **never unmount**. They animate to new states when `currentScene` changes, creating visual continuity across scene cuts instead of hard resets.

```tsx
import { motion } from 'framer-motion';

export function PersistentLayers({ currentScene }: { currentScene: number }) {
  return (
    <>
      {/* Gradient that shifts between scenes */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: currentScene === 0
            ? 'radial-gradient(ellipse at 30% 40%, rgba(VAR_R,VAR_G,VAR_B,0.25) 0%, #YOUR_BG 70%)'
            : currentScene === 1
            ? 'radial-gradient(ellipse at 70% 20%, rgba(VAR_R,VAR_G,VAR_B,0.15) 0%, #YOUR_BG 60%)'
            : 'radial-gradient(ellipse at 50% 80%, rgba(VAR_R,VAR_G,VAR_B,0.3) 0%, #YOUR_BG 65%)',
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Floating shape that drifts and rotates between scenes */}
      <motion.div
        className="absolute w-[35vw] h-[35vw] border border-white/10 rotate-45 z-0"
        animate={{
          x: [0, '40vw', '60vw', '20vw'][currentScene] ?? '20vw',
          y: ['-10vh', '10vh', '50vh', '20vh'][currentScene] ?? '-10vh',
          rotate: currentScene * 60 + 45,
          opacity: 0.4,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Second floating shape — opposite movement */}
      <motion.div
        className="absolute w-[20vw] h-[20vw] border border-white/10 z-0"
        animate={{
          x: ['70vw', '10vw', '80vw'][currentScene] ?? '70vw',
          y: ['60vh', '70vh', '10vh'][currentScene] ?? '60vh',
          rotate: -(currentScene * 40),
        }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Accent line that morphs between scenes */}
      <motion.div
        className="absolute bg-[var(--color-primary)] z-10"
        animate={{
          width: currentScene === 1 ? '100vw' : '2px',
          height: currentScene === 1 ? '2px' : '30vh',
          left: currentScene === 1 ? '0' : '85vw',
          top: currentScene === 1 ? '20vh' : '0',
          opacity: currentScene === 0 ? 0 : 0.7,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  );
}
```

---

## Scene Patterns

### Pattern A — Hero Brand Reveal

Use for the first scene. Stagger container fades in children one by one.

```tsx
import { motion } from 'framer-motion';

export function Scene1Intro() {
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.8 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      variants={container} initial="hidden" animate="visible" exit="exit"
    >
      {/* Logo / Icon */}
      <motion.div variants={item} className="mb-6 relative" style={{ width: '8vw', height: '8vw' }}>
        <div className="absolute inset-0 bg-[var(--color-primary)] blur-[50px] opacity-25 rounded-full" />
        {/* Place your logo SVG or image here */}
        <YourLogoSVG />
      </motion.div>

      {/* Main title */}
      <motion.div variants={item} className="relative">
        <h1 className="text-[5vw] font-display text-white leading-none tracking-tight">
          YOUR<span className="text-[var(--color-primary)]">BRAND</span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div variants={item} className="flex items-center gap-4 mt-3">
        <div className="h-px w-8 bg-[var(--color-secondary)] opacity-70" />
        <p className="text-[1.5vw] font-body tracking-widest text-[var(--color-secondary)]">
          YOUR TAGLINE
        </p>
        <div className="h-px w-8 bg-[var(--color-secondary)] opacity-70" />
      </motion.div>
    </motion.div>
  );
}
```

### Pattern B — Staggered Feature List

Use for scenes showing multiple items that reveal one by one with a timer.

```tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2Features() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Stagger item reveals at 800ms intervals
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const features = [
    { label: 'Feature One',   sub: 'Short description' },
    { label: 'Feature Two',   sub: 'Short description' },
    { label: 'Feature Three', sub: 'Short description' },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center pl-[18vw] z-10"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.8 } }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <motion.h2
          className="text-[5vw] font-display text-white mb-2 leading-tight"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          SECTION TITLE
        </motion.h2>
        <motion.p
          className="text-[1.5vw] font-body text-[var(--color-text-muted)] uppercase tracking-widest mb-12"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Section Subtitle
        </motion.p>

        <div className="space-y-8">
          {features.map((f, i) => (
            <FeatureItem key={i} label={f.label} sub={f.sub} active={step > i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FeatureItem({ label, sub, active }: { label: string; sub: string; active: boolean }) {
  return (
    <div className="flex items-center gap-5">
      <motion.div
        className="w-10 h-10 flex-shrink-0 border flex items-center justify-center"
        animate={{
          borderColor: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
          backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-[var(--color-primary)]"
          animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
        />
      </motion.div>
      <div className="overflow-hidden">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={active ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <p className="text-[1.8vw] font-body text-white">{label}</p>
          <p className="text-[1vw] font-display text-[var(--color-primary)] uppercase tracking-wide">{sub}</p>
        </motion.div>
      </div>
    </div>
  );
}
```

### Pattern C — Architecture / Tech Nodes

Use for showing system diagrams, tech stacks, or connected components.

```tsx
import { motion } from 'framer-motion';

export function Scene3Architecture() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.8 } }}
      transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
    >
      <h2 className="text-[6vw] font-display text-white mb-16">ARCHITECTURE</h2>

      <div className="flex items-center w-[75vw]">
        <ArchNode label="Input" delay={0.6} />
        <ArchConnector delay={0.9} />
        <ArchNode label="Core" main delay={1.1} />
        <ArchConnector delay={1.3} />
        <ArchNode label="Output" delay={1.5} />
      </div>
    </motion.div>
  );
}

function ArchNode({ label, main = false, delay }: { label: string; main?: boolean; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, type: 'spring' }}
    >
      <div className={`
        flex items-center justify-center rotate-45
        ${main
          ? 'w-[9vw] h-[9vw] border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'w-[6vw] h-[6vw] border border-white/20 bg-white/5'}
      `}>
        {main && (
          <motion.div
            className="absolute inset-0 border border-[var(--color-primary)]"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <p className={`mt-6 text-[1.3vw] font-display uppercase tracking-wider ${main ? 'text-[var(--color-primary)]' : 'text-white/60'}`}>
        {label}
      </p>
    </motion.div>
  );
}

function ArchConnector({ delay }: { delay: number }) {
  return (
    <div className="flex-1 h-px mx-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/10" />
      <motion.div
        className="absolute h-full w-full bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, delay, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
```

### Pattern D — Full-Bleed Color Takeover

Use for a high-impact accent scene. Floods the screen with your brand color.

```tsx
import { motion } from 'framer-motion';

export function Scene4Takeover() {
  const chars = "YOUR MESSAGE".split('');

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-primary)]"
      initial={{ scaleY: 0, transformOrigin: 'bottom' }}
      animate={{ scaleY: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 0.8 } }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex flex-col items-center">
        {/* Character-by-character text reveal */}
        <div className="flex gap-2 overflow-hidden py-4">
          {chars.map((char, i) => (
            <motion.span
              key={i}
              className="text-[8vw] font-display text-white leading-none"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>

        <motion.p
          className="text-[1.8vw] font-body text-white/70 tracking-[0.3em] uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          Supporting line
        </motion.p>
      </div>
    </motion.div>
  );
}
```

### Pattern E — Final Lockup

Use for the closing scene. Brand name + tagline + subtle pulse.

```tsx
import { motion } from 'framer-motion';

export function Scene5Final() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'circOut' }}
    >
      {/* Glowing halo behind brand name */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] bg-[var(--color-primary)] opacity-15 blur-[100px] rounded-full"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <h1 className="text-[7vw] font-display text-white tracking-tight relative z-10">
        YOUR<span className="text-[var(--color-primary)]">BRAND</span>
      </h1>

      {/* Animated divider */}
      <motion.div
        className="w-px bg-gradient-to-b from-[var(--color-primary)] to-transparent my-8"
        initial={{ height: 0 }}
        animate={{ height: 80 }}
        transition={{ duration: 1, delay: 1 }}
      />

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <p className="text-[2vw] font-body text-white mb-2">Your main tagline here</p>
        <p className="text-[1.2vw] font-display text-white/50 tracking-widest uppercase">
          Supporting descriptor
        </p>
      </motion.div>
    </motion.div>
  );
}
```

---

## Motion Reference

### Springs (from `lib/video/animations.ts`)

```ts
springs.snappy  // stiffness 400, damping 30  — UI elements, quick snaps
springs.bouncy  // stiffness 300, damping 15  — playful elements
springs.smooth  // stiffness 120, damping 25  — default smooth motion
springs.gentle  // stiffness 100, damping 20  — floaty / atmospheric
```

### Timing

| Role | Duration |
|---|---|
| Micro shifts | 0.1–0.2s |
| Element entrance | 0.3–0.6s |
| Scene transition | 0.8–1.0s |
| Hero reveal | 1.2–1.5s |
| Background atmosphere | 2–4s |

### Preferred easing
```ts
ease: [0.16, 1, 0.3, 1]   // expressive ease-out — use for most entrances
ease: 'circOut'             // sharp deceleration — good for slides
ease: [0.76, 0, 0.24, 1]  // sharp ease-in-out — dramatic takeovers
```

### Glow effects (add to `index.css`)
```css
.glow-primary { box-shadow: 0 0 30px rgba(VAR_R, VAR_G, VAR_B, 0.4); }
.text-gradient {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Rules

1. **No emojis** — replace with inline SVG icons using brand color stroke
2. **No flat backgrounds** — minimum 3 layers: atmosphere gradient + floating shapes + foreground content
3. **Font sizes in `vw`** — ensures consistent scaling: `text-[5vw]` hero, `text-[2vw]` subtitle, `text-[1.2vw]` label
4. **Every scene needs an exit animation** — or the loop will look broken
5. **Background elements belong in PersistentLayers** — not inside individual scenes
6. **Scene duration ≥ longest internal setTimeout + 1 second buffer**
7. **Stagger everything** — never reveal all elements at once
8. **Never use the same transition duration twice in a row** — vary rhythm

---

## Adding a New Scene

1. Create `SceneN<Name>.tsx` in `src/components/video/`
2. Add the import to `VideoTemplate.tsx`
3. Add `{currentScene === N && <SceneN key="sceneN" />}` inside `<AnimatePresence>`
4. Add a duration key to `SCENE_DURATIONS`
5. Update `PersistentLayers.tsx` to include the new scene index in gradient/shape animations

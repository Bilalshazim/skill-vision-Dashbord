# SkillVision SOP: Animation, Transitions & Module Switching Standard Operating Procedures

**(Repository: `Bilalshazim/skill-vision-Dashbord` | React + TypeScript + Framer Motion)**

This document defines the strict animation standards, Framer Motion presets, and performance rules for smooth, high-speed UI transitions across the **SkillVision Dashboard** repository (`github.com/Bilalshazim/skill-vision-Dashbord.git`)—specifically covering the **Unified Login Shell**, **Recruiting Portal**, and **Assessment Engine**.

---

## 1. SkillVision Repository Context

This repository (`Bilalshazim/skill-vision-Dashbord`) operates under a **Unified Shell & Dual-Module Architecture**:

* **Unified Login & Auth Shell:** Top-level application wrapper managing authentication context and seamless module switching without browser hard-reloads.
* **Recruiting Portal (`/recruiting` / Recruiting Views):** Candidate pipelines, job boards, Kanban boards, and interview management.
* **Assessment Engine (`/assessment` / Assessment Views):** Candidate tests, dynamic code/quiz evaluations, real-time scoring, and report analytics.
* **PWA / Standalone Webview Link Execution:** When running as a standalone app or webview link wrapper, navigation must mimic native iOS/Android transitions.

---

## 2. Animation Presets (`src/constants/animationPresets.ts`)

Create or update `src/constants/animationPresets.ts` (or `src/utils/animationPresets.ts`) in the repository with these exact variants and spring physics:

```typescript
import { Variants, Transition } from 'framer-motion';

/**
 * High-Precision Spring Physics for Sliding Navigation Pills
 */
export const ULTRA_TAB_SPRING: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 38,
  mass: 0.5,
};

/**
 * Unified Shell Module Switching Variants (Blur Fade + Scale)
 * Used when switching between Recruiting and Assessment Engine portals.
 */
export const MODULE_SHELL_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.15,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

/**
 * Rapid In-Module Dashboard View Transition
 * Used for route and sub-tab transitions inside Recruiting / Assessment.
 */
export const FAST_PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.985,
    y: 4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: [0.2, 0, 0, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: -4,
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Link-Wrapper / Mobile Standalone Slide Variant
 */
export const WEB_APP_SLIDE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    x: 16,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: {
      duration: 0.14,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

/**
 * Micro Stagger Variants for Cards, Grids, and Lists
 */
export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const STAGGER_CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
};
```

---

## 3. Reusable Implementation Components

### A. Sliding Active Tab Rail Component (`src/components/common/AnimatedTabRail.tsx`)

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ULTRA_TAB_SPRING } from '../../constants/animationPresets';

export interface TabItem {
  id: string;
  label: string;
}

interface AnimatedTabRailProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  layoutId?: string;
}

export const AnimatedTabRail: React.FC<AnimatedTabRailProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  layoutId = 'skillVisionActivePill',
}) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-inner">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-150 rounded-xl outline-none select-none ${
              isActive
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm -z-0"
                transition={ULTRA_TAB_SPRING}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
```

### B. Animated Number Counter Component (`src/components/common/AnimatedCounter.tsx`)

```tsx
import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = '', suffix = '' }) => {
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 120, damping: 20 });
  const display = useTransform(rounded, (latest) => `${prefix}${Math.floor(latest).toLocaleString()}${suffix}`);

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
};
```

### C. Portal / View Transition Wrapper (`src/components/common/ViewTransitionWrapper.tsx`)

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_SHELL_VARIANTS, FAST_PAGE_VARIANTS, WEB_APP_SLIDE_VARIANTS } from '../../constants/animationPresets';

interface ViewTransitionWrapperProps {
  children: React.ReactNode;
  viewKey: string;
  mode?: 'shell' | 'page' | 'standalone';
}

export const ViewTransitionWrapper: React.FC<ViewTransitionWrapperProps> = ({
  children,
  viewKey,
  mode = 'page',
}) => {
  const getVariants = () => {
    switch (mode) {
      case 'shell':
        return MODULE_SHELL_VARIANTS;
      case 'standalone':
        return WEB_APP_SLIDE_VARIANTS;
      case 'page':
      default:
        return FAST_PAGE_VARIANTS;
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

---

## 4. Mobile Wrapper & PWA Rules

For standalone browser links and webview app instances:

1. **Prevent Refresh Interruption:** Handle all module switches (Recruiting <-> Assessment) in React state / SPA routing.
2. **Prevent Touch Delay:** Add `touch-action: manipulation;` and `user-select: none;` on all tab switches, buttons, and candidate actions.
3. **Tactile Tap States:** Add `whileTap={{ scale: 0.97 }}` to all interactive triggers.
4. **Prevent Elastic Bounce:** Add `overscroll-behavior-y: none;` to `html, body`.

---

## 5. Performance & Layout Rules

1. **GPU-Only Animation:** Animate only `transform` (`scale`, `translateX`, `translateY`) and `opacity` (plus slight `filter` blurs). Never animate width, height, or positional offsets directly.
2. **Layout Shift (CLS) Prevention:** Keep view containers enclosed in explicit `min-h-[...]` boundaries or relative flex-grow layout wrappers.
3. **Reduced Motion:** Ensure full compatibility with system settings:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
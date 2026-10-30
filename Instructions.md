# SkillVision SOP: Animation, Transitions & Module Switching Standard Operating Procedures
**(React + TypeScript + Framer Motion)**

This document defines the strict animation standards, Framer Motion presets, and performance rules for smooth, high-speed UI transitions across **SkillVision**—specifically covering the **Unified Login Shell**, **Recruiting Module**, and **Assessment Engine**.

---

## 1. SkillVision Architecture Context

SkillVision operates under a **Unified Shell & Login Architecture**:
* **Unified Auth & Shell:** A top-level container managing authentication, context, and seamless portal switching.
* **Recruiting Module:** Candidate pipelines, job boards, Kanban boards, and interview scheduling views.
* **Assessment Engine:** Candidate tests, dynamic code/quiz evaluations, real-time feedback, and report views.
* **Link-Wrapper & Mobile App Execution:** SkillVision loaded inside PWA/Webview standalone wrappers must operate as a seamless native application with zero browser navigation delays.

---

## 2. Animation Core Presets

Use these exact Framer Motion animation configurations across all SkillVision UI components for consistency.

```typescript
import { Variants, Transition } from 'framer-motion';

/**
 * Ultra-Fast Tab Slider Spring Preset
 * Used for sliding background pill indicators on navigation, Recruiting/Assessment tab switches.
 */
export const SNAPPY_TAB_SPRING: Transition = {
  type: 'spring',
  stiffness: 600, // High stiffness for instant acceleration
  damping: 35,    // Damping prevents overshoot/wobble
  mass: 0.5,      // Low mass for lightweight, snappy feel
};

/**
 * Unified Shell Module Switching Variants
 * Used when switching between SkillVision Modules (e.g. Recruiting <-> Assessment Engine).
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
 * Used for sub-navigation within Recruiting (Candidates -> Jobs -> Interviews) or Assessment.
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
      ease: [0.2, 0, 0, 1], // Fast-out cubic bezier curve
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
 * SkillVision Link-Wrapper / Mobile App Slide Variant
 * Designed specifically when running SkillVision inside PWA or native Webview wrappers.
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
 * Micro Stagger Variants for Recruiting Kanban & Assessment Test Cards
 */
export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // 30ms offset per item
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

## 3. SkillVision Implementation Components

### A. Unified Shell Module Selector (Recruiting vs. Assessment Switcher)

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { SNAPPY_TAB_SPRING } from './animationPresets';

export type SkillVisionModule = 'recruiting' | 'assessment';

interface ModuleSwitcherProps {
  activeModule: SkillVisionModule;
  onModuleSwitch: (module: SkillVisionModule) => void;
}

export const SkillVisionModuleSwitcher: React.FC<ModuleSwitcherProps> = ({ activeModule, onModuleSwitch }) => {
  const modules = [
    { id: 'recruiting', label: 'Recruiting Portal' },
    { id: 'assessment', label: 'Assessment Engine' },
  ];

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-inner">
      {modules.map((mod) => {
        const isActive = activeModule === mod.id;
        return (
          <button
            key={mod.id}
            onClick={() => onModuleSwitch(mod.id as SkillVisionModule)}
            className={`relative px-5 py-2 text-sm font-semibold transition-colors duration-150 rounded-xl outline-none select-none ${
              isActive
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeModuleShellPill"
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-md -z-0"
                transition={SNAPPY_TAB_SPRING}
              />
            )}
            <span className="relative z-10">{mod.label}</span>
          </button>
        );
      })}
    </div>
  );
};
```

### B. Unified Shell Page & Portal Transition Container

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_SHELL_VARIANTS, FAST_PAGE_VARIANTS, WEB_APP_SLIDE_VARIANTS } from './animationPresets';

interface SkillVisionTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  level?: 'module-shell' | 'sub-view' | 'mobile-app';
}

export const SkillVisionTransitionWrapper: React.FC<SkillVisionTransitionProps> = ({
  children,
  viewKey,
  level = 'sub-view',
}) => {
  const getVariants = () => {
    switch (level) {
      case 'module-shell':
        return MODULE_SHELL_VARIANTS;
      case 'mobile-app':
        return WEB_APP_SLIDE_VARIANTS;
      case 'sub-view':
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

## 4. SkillVision Mobile Wrapper & App-Link Rules

When SkillVision is loaded as a PWA, webview wrapper, or standalone link application:

1. **Client-Side Module Swaps:** Never force full browser reloads when switching between Recruiting, Assessment, and User Settings under the unified login.
2. **Native Gesture Prevention:** Apply `overscroll-behavior-y: none;` on `html, body` to block unwanted elastic pull-to-refresh behavior during live candidate assessments.
3. **Instant Action Feedback:** Add `touch-action: manipulation;` and `user-select: none;` on buttons, tab choices, and candidate cards to remove the 300ms mobile touch delay.
4. **Button Tap States:** Every clickable trigger (e.g., "Submit Candidate", "Start Assessment") must utilize Framer Motion `whileTap={{ scale: 0.97 }}` for tactile micro-feedback.

---

## 5. Performance & Layout Requirements

1. **GPU-Only Properties:** Only animate `transform` (`scale`, `translateX`, `translateY`) and `opacity` (plus slight `filter` blurs on shell level transitions). Never animate `width`, `height`, `left`, `top`, `margin`, or `padding`.
2. **Zero Layout Shift (CLS):** Keep Recruiting Kanban columns and Assessment test question view containers enclosed in fixed or `min-h-[...]` viewport configurations.
3. **Accessibility:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
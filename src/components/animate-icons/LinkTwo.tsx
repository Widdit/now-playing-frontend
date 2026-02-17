"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from "@/components/animate-ui/icons/Icon";

type LinkTwoProps = IconProps<keyof typeof animations>;

const spring = { type: "spring", damping: 20, stiffness: 200 } as const;

const animations = {
  // Little "clink" at the joint
  default: {
    left: {
      initial: { rotate: 0, transformOrigin: "9px 12px" },
      animate: {
        rotate: [0, 10, 0],
        transformOrigin: "9px 12px",
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    },
    right: {
      initial: { rotate: 0, transformOrigin: "15px 12px" },
      animate: {
        rotate: [0, -6, 0],
        transformOrigin: "15px 12px",
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    },
    middle: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, 12, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    },
    burstTop: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstLeft: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstBottom: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstRight: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
  } satisfies Record<string, Variants>,

  // Pull apart: arcs move outward, line shrinks away
  unlink: {
    left: {
      initial: { x: 0 },
      animate: { x: -1, transition: spring },
    },
    right: {
      initial: { x: 0 },
      animate: { x: 1, transition: spring },
    },
    middle: {
      initial: { opacity: 1, scale: 1 },
      animate: {
        opacity: 0,
        scale: 0,
        transition: { ...spring, delay: 0.1 },
      },
    },
    burstTop: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstLeft: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstBottom: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstRight: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: "easeInOut", delay: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,

  // Pull apart loop
  "unlink-loop": {
    left: {
      initial: { x: 0 },
      animate: {
        x: [-1, 0, -1],
        transition: { duration: 0.6, ease: "easeInOut" },
      },
    },
    right: {
      initial: { x: 0 },
      animate: {
        x: [1, 0, 1],
        transition: { duration: 0.6, ease: "easeInOut" },
      },
    },
    middle: {
      initial: { opacity: 1, scale: 1 },
      animate: {
        opacity: [1, 0, 1],
        scale: [1, 0, 1],
        transition: { duration: 0.6, ease: "easeInOut", delay: 0.1 },
      },
    },
    burstTop: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstLeft: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstBottom: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: "easeInOut", delay: 0.2 },
      },
    },
    burstRight: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: "easeInOut", delay: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,

  // Emphasize link: arcs nudge toward center, line pulses slightly
  link: {
    left: {
      initial: { x: 0 },
      animate: {
        x: [0, 1.5, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    },
    right: {
      initial: { x: 0 },
      animate: {
        x: [0, -1.5, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    },
    burstTop: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstLeft: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstBottom: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstRight: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: LinkTwoProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(props as any)}
    >
      <motion.g
        initial="initial"
        animate={controls}
        whileHover="animate"
        whileTap="animate"
      >
        {/* Left arc */}
        <motion.path d="M9 17H7A5 5 0 0 1 7 7h2" variants={variants.left} />

        {/* Right arc */}
        <motion.path
          d="M15 7h2a5 5 0 1 1 0 10h-2"
          variants={variants.right}
        />

        {/* Middle line */}
        <motion.line
          x1={8}
          y1={12}
          x2={16}
          y2={12}
          style={{ transformOrigin: "12px 12px" }}
          variants={variants.middle}
        />

        {/* Explosion lines (shown in unlink) - rotated around center to avoid overlap */}
        <motion.g style={{ rotate: 45, transformOrigin: "12px 12px" }}>
          <motion.line
            x1={8}
            y1={2}
            x2={8}
            y2={5}
            style={{ transformOrigin: "8px 3.5px" }}
            variants={variants.burstTop}
          />
          <motion.line
            x1={2}
            y1={8}
            x2={5}
            y2={8}
            style={{ transformOrigin: "3.5px 8px" }}
            variants={variants.burstLeft}
          />
          <motion.line
            x1={16}
            y1={19}
            x2={16}
            y2={22}
            style={{ transformOrigin: "16px 20.5px" }}
            variants={variants.burstBottom}
          />
          <motion.line
            x1={19}
            y1={16}
            x2={22}
            y2={16}
            style={{ transformOrigin: "20.5px 16px" }}
            variants={variants.burstRight}
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

function LinkTwo(props: LinkTwoProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  LinkTwo,
  LinkTwo as LinkTwoIcon,
  type LinkTwoProps,
  type LinkTwoProps as LinkTwoIconProps,
};

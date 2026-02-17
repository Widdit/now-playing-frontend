import React, { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { AnimatePresence, motion, easeIn, easeOut } from "framer-motion";
import { addToast } from "@heroui/toast";

import { CopyIcon, CheckIcon } from "@/components/Icons";

const iconVariants = {
  initial: {
    scale: 1.2,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: easeOut,
    },
  },
  exit: {
    scale: 0.4,
    opacity: 0,
    transition: {
      duration: 0.12,
      ease: easeIn,
    },
  },
};

const iconWrapperStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const CopyButton = (props: any) => {
  const [pressed, setPressed] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Button
      {...props}
      isIconOnly
      onPress={async () => {
        if (pressed) return;

        try {
          await navigator.clipboard.writeText(props.copyContent);
        } catch (err: any) {
          console.error("复制请求 URL 失败", err);
          addToast({
            title: "复制失败",
            description: `${err.message}`,
            color: "danger",
            timeout: 6000,
          });

          return;
        }

        setPressed(true);

        timerRef.current = window.setTimeout(() => {
          setPressed(false);
        }, props.timeout || 1500);
      }}
    >
      <AnimatePresence mode="wait">
        {pressed ? (
          <motion.span
            key="check"
            animate="animate"
            exit="exit"
            initial="initial"
            style={iconWrapperStyle}
            variants={iconVariants}
          >
            <CheckIcon />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            animate="animate"
            exit="exit"
            initial="initial"
            style={iconWrapperStyle}
            variants={iconVariants}
          >
            <CopyIcon />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
};

export default CopyButton;

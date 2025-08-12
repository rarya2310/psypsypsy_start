"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction: number) => {
      // clamp fraction to [0,1] to keep math stable
      let f = Math.max(0, Math.min(1, fraction));
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / (f || 1e-6) - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(f, 0.4) * 100}%`;

        f = 1 - f;
        text1Ref.current.style.filter = `blur(${Math.min(8 / (f || 1e-6) - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = (dt: number) => {
      // progress morph by elapsed time
      morph += dt;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
        morph = 0; // reset for next cycle
      }

      setMorph(fraction);
    };

  let raf = 0;
  function animate() {
      raf = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph(dt);
      } else {
        doCooldown();
      }
    }

    // Initialize content so it's visible immediately
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = texts[textIndex % texts.length];
      text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
      // Start in cooldown state so text2 is visible at first
      text2Ref.current.style.filter = "";
      text2Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter = "";
      text1Ref.current.style.opacity = "0%";
    }

    animate();

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("relative w-full h-full", className)} style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ filter: "url(#threshold)", position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center whitespace-nowrap left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl md:text-[120pt]",
            "text-foreground",
            textClassName
          )}
          style={{ fontSize: "10vw", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", whiteSpace: "nowrap", lineHeight: 1, color: "black", willChange: "filter, opacity, transform" }}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center whitespace-nowrap left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl md:text-[120pt]",
            "text-foreground",
            textClassName
          )}
          style={{ fontSize: "10vw", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", whiteSpace: "nowrap", lineHeight: 1, color: "black", willChange: "filter, opacity, transform" }}
        />
      </div>
    </div>
  );
}

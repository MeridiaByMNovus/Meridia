import React, { useEffect, useRef, useState } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position }) => {
  const [calculatedPosition, setCalculatedPosition] =
    useState<TooltipPosition>("bottom");
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!position && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const padding = 10;

      const pos: TooltipPosition =
        rect.right > window.innerWidth - padding
          ? "left"
          : rect.left < padding
            ? "right"
            : rect.top < padding
              ? "bottom"
              : "top";

      setCalculatedPosition(pos);
    }
  }, [text, position]);

  const finalPosition = position || calculatedPosition;

  return (
    <div className="tooltip-container">
      <div className="tooltip-wrapper">
        {children}
        <span
          ref={tooltipRef}
          className={`tooltip-text tooltip-${finalPosition}`}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

export default Tooltip;

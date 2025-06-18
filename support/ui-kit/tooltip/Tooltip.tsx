import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipText = styled.span<{ position: string }>`
  visibility: hidden;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  padding: 6px 10px;
  border-radius: 4px;
  position: absolute;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 100;

  ${({ position }) =>
    position === "right"
      ? `left: 100%; top: 50%; transform: translateY(-50%)`
      : position === "left"
        ? `right: 100%; top: 50%; transform: translateY(-50%)`
        : position === "top"
          ? `bottom: 125%; left: 50%; transform: translateX(-50%)`
          : `top: 125%; left: 50%; transform: translateX(-50%)`};

  &::after {
    content: "";
    position: absolute;
    ${({ position, theme }) =>
      position === "right"
        ? `left: -5px; top: 50%; transform: translateY(-50%);
           border-width: 5px; border-style: solid; border-color: transparent ${theme.colors.border} transparent transparent;`
        : position === "left"
          ? `right: -5px; top: 50%; transform: translateY(-50%);
           border-width: 5px; border-style: solid; border-color: transparent transparent transparent ${theme.colors.border};`
          : position === "top"
            ? `top: 100%; left: 50%; transform: translateX(-50%);
           border-width: 5px; border-style: solid; border-color: ${theme.colors.border} transparent transparent transparent;`
            : `bottom: 100%; left: 50%; transform: translateX(-50%);
           border-width: 5px; border-style: solid; border-color: transparent transparent${theme.colors.border} transparent;`}
  }
`;

const TooltipWrapper = styled.div`
  &:hover ${TooltipText} {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = ({
  text,
  children,
  position,
}: {
  text: string;
  children: React.ReactNode;
  position?: string;
}) => {
  const [manlPosition, setPosition] = useState(position ? position : "bottom");
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const padding = 10;

      if (position === undefined) {
        if (rect.right > window.innerWidth - padding) {
          setPosition("left");
        } else if (rect.left < padding) {
          setPosition("right");
        } else if (rect.top < padding) {
          setPosition("bottom");
        } else {
          setPosition("top");
        }
      }
    }
  }, [text]);

  return (
    <TooltipContainer>
      <TooltipWrapper>
        {children}
        <TooltipText ref={tooltipRef} position={position}>
          {text}
        </TooltipText>
      </TooltipWrapper>
    </TooltipContainer>
  );
};

export default Tooltip;

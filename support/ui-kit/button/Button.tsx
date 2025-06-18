import styled from "styled-components";

interface ButtonProps {
  type?: "normal" | "rounded" | "circle" | "danger" | "info" | "icon";
  icon?: React.ReactNode;
  iconOnly?: boolean;
  iconPosition?: "left" | "right";
}

export const Button = styled.button<ButtonProps>`
  background-color: ${({ theme, type }) =>
    type === "danger"
      ? theme.colors.danger
      : type === "info"
        ? theme.colors.secondary
        : type === "normal"
          ? theme.colors.normal
          : theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 12px;
  cursor: pointer;
  border-radius: ${({ type }) =>
    type === "rounded" ? "20px" : type === "circle" ? "50%" : "6px"};
  transition: background-color 0.2s;
  gap: ${({ iconPosition }) =>
    iconPosition === "left" ? "10px" : iconPosition === "right" ? "10px" : "0"};

  &:hover {
    background-color: ${({ theme, type }) =>
      type === "danger"
        ? "#c62828"
        : type === "info"
          ? "#1976d2"
          : theme.colors.secondary};
  }

  & > svg,
  & > img {
    width: ${({ iconOnly }) => (iconOnly ? "20px" : "auto")};
    height: ${({ iconOnly }) => (iconOnly ? "20px" : "auto")};
  }

  & > span {
    display: ${({ iconOnly }) => (iconOnly ? "none" : "inline")};
  }
`;

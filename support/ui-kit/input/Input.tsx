import styled, { keyframes } from "styled-components";

interface InputProps {}

const borderBottomAnimation = keyframes`
  0% {
    border-bottom-width: 0;
  }
  100% {
    border-bottom-width: 1px;
  }
`;

export const Input = styled.input<InputProps>`
  background-color: ${({ theme }) => theme.input.background};
  color: ${({ theme }) => theme.colors.text};

  border: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.input.borderTopLeftRadius}px;
  border-top-right-radius: ${({ theme }) => theme.input.borderTopRightRadius}px;
  border-bottom-right-radius: ${({ theme }) =>
    theme.input.borderBottomRightRadius}px;
  border-bottom-left-radius: ${({ theme }) =>
    theme.input.borderBottomLeftRadius}px;
  outline: 1px solid ${({ theme }) => theme.colors.border};
  padding: 6px;

  &:focus {
    border-bottom: 1px solid ${({ theme }) => theme.input.activeBorder};
    animation: ${borderBottomAnimation} 0.3s ease-out forwards;
  }
`;

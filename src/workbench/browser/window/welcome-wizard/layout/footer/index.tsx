import { ReactNode } from "react";

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="footer-wrapper">
      <span></span>
      {children}
    </div>
  );
}

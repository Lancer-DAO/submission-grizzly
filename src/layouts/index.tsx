import { Header } from "@/src/components";
import { ReactNode } from "react";

export const PageLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      <Header />
      <div className="page-content">{children}</div>
    </div>
  );
};

"use client";

import { ReactNode } from "react";

interface ReduxDevToolsProps {
  children: ReactNode;
}

export default function ReduxDevTools({ children }: ReduxDevToolsProps) {
  // Only show Redux DevTools in development
  if (process.env.NODE_ENV === "production") {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {/* Redux DevTools will be automatically injected in development */}
    </>
  );
}

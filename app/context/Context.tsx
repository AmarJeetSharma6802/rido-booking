"use client";

import { createContext, useContext, useState } from "react";

interface NavContextValue {
  active: string | null;
  setActive: React.Dispatch<React.SetStateAction<string | null>>;
}

const NavContext = createContext<NavContextValue | null>(null);

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState<string | null>(null);

  return (
    <NavContext.Provider value={{ active, setActive }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);

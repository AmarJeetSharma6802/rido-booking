"use client"
import { createContext, useContext, useState } from "react";

const NavContext = createContext<any>(null);

export const NavProvider = ({ children }: any) => {
  const [active, setActive] = useState(null);

  return (
    <NavContext.Provider value={{ active, setActive }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
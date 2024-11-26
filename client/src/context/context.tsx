// contexts/UserContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  email: string;
  name?: string;
  phone:string;
  address:string;
}

interface UserContextType {
    data: User | null;
    setData: React.Dispatch<React.SetStateAction<User | null>>;
  }
  
  const UserContext = createContext<UserContextType | undefined>(undefined);
  
  export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<User | null>(() => {
      // Load user from localStorage on initial load
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
      }
      return null;
    });
  
    return (
      <UserContext.Provider value={{ data, setData }}>
        {children}
      </UserContext.Provider>
    );
  };
  
  export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
      throw new Error("useUser must be used within a UserProvider");
    }
    return context;
  };
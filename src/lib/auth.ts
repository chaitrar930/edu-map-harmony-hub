
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  name?: string;
  email: string;
  role: string;
  usn?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => boolean;
  signUp: (userData: any) => boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => false,
  signUp: () => false,
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const signIn = (email: string, password: string): boolean => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((u: User) => u.email === email);
  
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  }
  
  return false;
};

export const signUp = (userData: any): boolean => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const existingUser = users.find((u: User) => u.email === userData.email);
  
  if (existingUser) {
    alert("User already exists!");
    return false;
  }
  
  const newUser = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    ...(userData.role === "student" && { usn: userData.usn }),
  };
  
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  return true;
};

export const signOut = () => {
  localStorage.removeItem("user");
};


import { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, signIn, signUp, signOut } from "@/lib/auth";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const authContextValue = {
    user,
    signIn: (email: string, password: string) => {
      const success = signIn(email, password);
      if (success) {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      }
      return success;
    },
    signUp,
    signOut: () => {
      signOut();
      setUser(null);
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContextValue}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route 
                path="/admin" 
                element={
                  user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/signin" />
                } 
              />
              <Route 
                path="/faculty" 
                element={
                  user?.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/signin" />
                } 
              />
              <Route 
                path="/student" 
                element={
                  user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/signin" />
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;

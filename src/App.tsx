import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import awsExports from "./amplify-config";
import { Button } from "./components/ui/button";

Amplify.configure(awsExports);

const queryClient = new QueryClient();

const App = () => {
  const [authMode, setAuthMode] = useState<'none' | 'signin' | 'guest'>('none');

  if (authMode === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm sm:max-w-md w-full">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                QuickNotes
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Fast and simple note-taking
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <Button 
                onClick={() => setAuthMode('signin')}
                className="w-full text-sm sm:text-base"
                size="lg"
              >
                Sign In / Sign Up
              </Button>
              
              <Button 
                onClick={() => setAuthMode('guest')}
                variant="outline"
                className="w-full text-sm sm:text-base"
                size="lg"
              >
                Continue as Guest
              </Button>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center mt-4 leading-relaxed">
              Guest mode saves notes locally. Sign in to sync across devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authMode === 'signin') {
    return (
      <Authenticator 
        signUpAttributes={['email']}
        hideSignUp={false}
        components={{
          SignUp: {
            FormFields() {
              return (
                <>
                  <Authenticator.SignUp.FormFields />
                </>
              );
            },
          },
        }}
      >
        {({ signOut, user }) => (
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="system" storageKey="quicknotes-theme">
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
                  <button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base">
                    Sign Out
                  </button>
                  <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base">Welcome, {user.username}!</p>
                </div>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        )}
      </Authenticator>
    );
  }

  // Guest mode
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="quicknotes-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
            <Button 
              onClick={() => setAuthMode('signin')}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Sign In
            </Button>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Guest Mode - notes saved locally</p>
          </div>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

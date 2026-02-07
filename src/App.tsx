 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route } from "react-router-dom";
 import { AuthProvider } from "@/hooks/useAuth";
 import HomePage from "./pages/HomePage";
 import AnimeDetailsPage from "./pages/AnimeDetailsPage";
 import WatchPage from "./pages/WatchPage";
 import SearchPage from "./pages/SearchPage";
 import CategoryPage from "./pages/CategoryPage";
 import LoginPage from "./pages/LoginPage";
 import SignupPage from "./pages/SignupPage";
 import ProfilePage from "./pages/ProfilePage";
 import WatchlistPage from "./pages/WatchlistPage";
 import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <AuthProvider>
         <Toaster />
         <Sonner />
         <BrowserRouter>
           <Routes>
             <Route path="/" element={<HomePage />} />
             <Route path="/anime/:id" element={<AnimeDetailsPage />} />
             <Route path="/watch/:id" element={<WatchPage />} />
             <Route path="/search" element={<SearchPage />} />
             <Route path="/category/:category" element={<CategoryPage />} />
             <Route path="/genre/:genre" element={<CategoryPage />} />
             <Route path="/recent/:status" element={<CategoryPage />} />
             <Route path="/login" element={<LoginPage />} />
             <Route path="/signup" element={<SignupPage />} />
             <Route path="/profile" element={<ProfilePage />} />
             <Route path="/watchlist" element={<WatchlistPage />} />
             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
             <Route path="*" element={<NotFound />} />
           </Routes>
         </BrowserRouter>
       </AuthProvider>
     </TooltipProvider>
   </QueryClientProvider>
 );

export default App;

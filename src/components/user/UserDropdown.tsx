 import { useState } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { User, LogOut, Settings, List, Bell } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import { useAuth } from "@/hooks/useAuth";
 import { useNotifications } from "@/hooks/useNotifications";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import NotificationDropdown from "./NotificationDropdown";
 
 export default function UserDropdown() {
   const { user, profile, signOut, loading } = useAuth();
   const { unreadCount } = useNotifications();
   const [showNotifications, setShowNotifications] = useState(false);
   const navigate = useNavigate();
 
   if (loading) {
     return (
       <div className="w-8 h-8 rounded-full shimmer" />
     );
   }
 
   if (!user) {
     return (
       <Link to="/login">
         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
           <User className="h-5 w-5" />
         </Button>
       </Link>
     );
   }
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/");
   };
 
   const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0];
   const avatarUrl = profile?.avatar_url;
 
   return (
     <div className="flex items-center gap-2">
       {/* Notifications */}
       <div className="relative">
         <Button
           variant="ghost"
           size="icon"
           className="text-muted-foreground hover:text-foreground relative"
           onClick={() => setShowNotifications(!showNotifications)}
         >
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
               {unreadCount > 9 ? "9+" : unreadCount}
             </span>
           )}
         </Button>
         <AnimatePresence>
           {showNotifications && (
             <NotificationDropdown onClose={() => setShowNotifications(false)} />
           )}
         </AnimatePresence>
       </div>
 
       {/* User Menu */}
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="relative h-9 w-9 rounded-full">
             <Avatar className="h-9 w-9">
               <AvatarImage src={avatarUrl || undefined} alt={displayName} />
               <AvatarFallback className="bg-primary text-primary-foreground">
                 {displayName?.charAt(0).toUpperCase()}
               </AvatarFallback>
             </Avatar>
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent className="w-56" align="end" forceMount>
           <div className="flex items-center gap-3 p-2">
             <Avatar className="h-10 w-10">
               <AvatarImage src={avatarUrl || undefined} alt={displayName} />
               <AvatarFallback className="bg-primary text-primary-foreground">
                 {displayName?.charAt(0).toUpperCase()}
               </AvatarFallback>
             </Avatar>
             <div className="flex flex-col">
               <span className="font-medium text-sm">{displayName}</span>
               <span className="text-xs text-muted-foreground">{user.email}</span>
             </div>
           </div>
           <DropdownMenuSeparator />
           <DropdownMenuItem asChild>
             <Link to="/profile" className="cursor-pointer">
               <Settings className="mr-2 h-4 w-4" />
               Profile Settings
             </Link>
           </DropdownMenuItem>
           <DropdownMenuItem asChild>
             <Link to="/watchlist" className="cursor-pointer">
               <List className="mr-2 h-4 w-4" />
               My Watchlist
             </Link>
           </DropdownMenuItem>
           <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
             <LogOut className="mr-2 h-4 w-4" />
             Sign Out
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
     </div>
   );
 }
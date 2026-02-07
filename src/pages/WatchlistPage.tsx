 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { Trash2, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import Header from "@/components/layout/Header";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useWatchlist, WatchlistStatus } from "@/hooks/useWatchlist";
 import { useAuth } from "@/hooks/useAuth";
 
 const statusConfig: Record<WatchlistStatus, { label: string; icon: typeof Eye; color: string }> = {
   watching: { label: "Watching", icon: Eye, color: "text-primary" },
   completed: { label: "Completed", icon: CheckCircle2, color: "text-success" },
   plan_to_watch: { label: "Plan to Watch", icon: Clock, color: "text-warning" },
   dropped: { label: "Dropped", icon: XCircle, color: "text-destructive" },
 };
 
 export default function WatchlistPage() {
   const { user, loading: authLoading } = useAuth();
   const { watchlist, loading, removeFromWatchlist } = useWatchlist();
   const [activeTab, setActiveTab] = useState<WatchlistStatus | "all">("all");
 
   const filteredList =
     activeTab === "all"
       ? watchlist
       : watchlist.filter((item) => item.status === activeTab);
 
   if (authLoading) {
     return (
       <div className="min-h-screen bg-background">
         <Header />
         <div className="pt-20 flex items-center justify-center min-h-[60vh]">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
         </div>
       </div>
     );
   }
 
   if (!user) {
     return (
       <div className="min-h-screen bg-background">
         <Header />
         <div className="pt-20 flex items-center justify-center min-h-[60vh]">
           <div className="text-center">
             <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
             <p className="text-muted-foreground mb-4">
               Please sign in to view your watchlist
             </p>
             <Link to="/login">
               <Button>Sign In</Button>
             </Link>
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       <Header />
 
       <main className="pt-20 pb-16">
         <div className="container mx-auto px-4">
           <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>
 
           <Tabs
             value={activeTab}
             onValueChange={(v) => setActiveTab(v as WatchlistStatus | "all")}
           >
             <TabsList className="bg-muted/50 mb-6 flex-wrap h-auto gap-1 p-1">
               <TabsTrigger value="all" className="flex-1 min-w-[80px]">
                 All ({watchlist.length})
               </TabsTrigger>
               {(Object.keys(statusConfig) as WatchlistStatus[]).map((status) => {
                 const config = statusConfig[status];
                 const count = watchlist.filter((w) => w.status === status).length;
                 return (
                   <TabsTrigger
                     key={status}
                     value={status}
                     className="flex-1 min-w-[100px] gap-1"
                   >
                     <config.icon className={`w-4 h-4 ${config.color}`} />
                     {config.label} ({count})
                   </TabsTrigger>
                 );
               })}
             </TabsList>
 
             <TabsContent value={activeTab} className="mt-0">
               {loading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                   {[...Array(6)].map((_, i) => (
                     <div key={i} className="aspect-[3/4] shimmer rounded-lg" />
                   ))}
                 </div>
               ) : filteredList.length === 0 ? (
                 <div className="text-center py-16">
                   <p className="text-muted-foreground mb-4">
                     {activeTab === "all"
                       ? "Your watchlist is empty"
                       : `No anime in "${statusConfig[activeTab as WatchlistStatus].label}"`}
                   </p>
                   <Link to="/">
                     <Button variant="outline">Browse Anime</Button>
                   </Link>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                   <AnimatePresence mode="popLayout">
                     {filteredList.map((item) => {
                       const config = statusConfig[item.status];
                       return (
                         <motion.div
                           key={item.id}
                           layout
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           className="group relative"
                         >
                           <Link to={`/anime/${item.anime_id}`}>
                             <div className="relative overflow-hidden rounded-lg card-hover">
                               <div className="aspect-[3/4]">
                                 <img
                                   src={item.anime_poster || "/placeholder.svg"}
                                   alt={item.anime_name}
                                   className="w-full h-full object-cover"
                                 />
                               </div>
                               {/* Status badge */}
                               <div
                                 className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-xs ${config.color}`}
                               >
                                 <config.icon className="w-3 h-3" />
                                 {config.label}
                               </div>
                               <div className="p-2">
                                 <h3 className="text-sm font-medium line-clamp-2">
                                   {item.anime_name}
                                 </h3>
                               </div>
                             </div>
                           </Link>
                           {/* Remove button */}
                           <Button
                             variant="destructive"
                             size="icon"
                             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                             onClick={(e) => {
                               e.preventDefault();
                               removeFromWatchlist(item.anime_id);
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </motion.div>
                       );
                     })}
                   </AnimatePresence>
                 </div>
               )}
             </TabsContent>
           </Tabs>
         </div>
       </main>
     </div>
   );
 }
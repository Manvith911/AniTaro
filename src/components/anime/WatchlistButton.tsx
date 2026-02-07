 import { useState } from "react";
 import { Plus, Check, ChevronDown, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useWatchlist, WatchlistStatus } from "@/hooks/useWatchlist";
 import { useAuth } from "@/hooks/useAuth";
 import { useNavigate } from "react-router-dom";
 
interface Props {
  animeId: string;
  animeName: string;
  animePoster: string | null;
  variant?: "default" | "icon";
}

const statusOptions: { value: WatchlistStatus; label: string; icon: typeof Eye }[] = [
  { value: "watching", label: "Watching", icon: Eye },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
  { value: "plan_to_watch", label: "Plan to Watch", icon: Clock },
  { value: "dropped", label: "Dropped", icon: XCircle },
];

export default function WatchlistButton({ animeId, animeName, animePoster, variant = "default" }: Props) {
   const { user } = useAuth();
   const { getWatchlistStatus, addToWatchlist, removeFromWatchlist } = useWatchlist();
   const navigate = useNavigate();
   const [loading, setLoading] = useState(false);
 
   const currentStatus = getWatchlistStatus(animeId);
 
   const handleStatusChange = async (status: WatchlistStatus) => {
     if (!user) {
       navigate("/login");
       return;
     }
 
     setLoading(true);
     if (currentStatus === status) {
       await removeFromWatchlist(animeId);
     } else {
       await addToWatchlist(animeId, animeName, animePoster, status);
     }
     setLoading(false);
   };
 
   const currentOption = currentStatus
     ? statusOptions.find((o) => o.value === currentStatus)
     : null;
 
   return (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <Button
              variant={currentStatus ? "secondary" : "outline"}
              size="icon"
              disabled={loading}
              className="flex-shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : currentStatus ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              variant={currentStatus ? "secondary" : "outline"}
              className="gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : currentOption ? (
                <>
                  <Check className="w-4 h-4" />
                  {currentOption.label}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to List
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
       <DropdownMenuContent align="start" className="w-48">
         {statusOptions.map((option) => (
           <DropdownMenuItem
             key={option.value}
             onClick={() => handleStatusChange(option.value)}
             className="cursor-pointer"
           >
             <option.icon className="w-4 h-4 mr-2" />
             {option.label}
             {currentStatus === option.value && (
               <Check className="w-4 h-4 ml-auto text-primary" />
             )}
           </DropdownMenuItem>
         ))}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }
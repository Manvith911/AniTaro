 import { useEffect, useRef } from "react";
 import { Link } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Bell, MessageCircle, Heart, AtSign, Tv, Check } from "lucide-react";
 import { useNotifications, NotificationType } from "@/hooks/useNotifications";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { formatDistanceToNow } from "date-fns";
 
 interface Props {
   onClose: () => void;
 }
 
 const iconMap: Record<NotificationType, typeof Bell> = {
   reply: MessageCircle,
   like: Heart,
   mention: AtSign,
   new_episode: Tv,
 };
 
 export default function NotificationDropdown({ onClose }: Props) {
   const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
   const ref = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (ref.current && !ref.current.contains(event.target as Node)) {
         onClose();
       }
     };
 
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [onClose]);
 
   return (
     <motion.div
       ref={ref}
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -10 }}
       className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-popover border border-border rounded-xl shadow-xl z-50"
     >
       <div className="flex items-center justify-between p-4 border-b border-border">
         <h3 className="font-semibold">Notifications</h3>
         {unreadCount > 0 && (
           <Button
             variant="ghost"
             size="sm"
             onClick={markAllAsRead}
             className="text-xs"
           >
             <Check className="w-3 h-3 mr-1" />
             Mark all read
           </Button>
         )}
       </div>
 
       <ScrollArea className="max-h-[400px]">
         {notifications.length === 0 ? (
           <div className="p-8 text-center text-muted-foreground">
             <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
             <p>No notifications yet</p>
           </div>
         ) : (
           <div className="divide-y divide-border">
             {notifications.map((notification) => {
               const Icon = iconMap[notification.type];
               return (
                 <Link
                   key={notification.id}
                   to={notification.link || "#"}
                   onClick={() => {
                     if (!notification.is_read) {
                       markAsRead(notification.id);
                     }
                     onClose();
                   }}
                   className={`block p-4 hover:bg-muted/50 transition-colors ${
                     !notification.is_read ? "bg-primary/5" : ""
                   }`}
                 >
                   <div className="flex gap-3">
                     <div
                       className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                         notification.type === "like"
                           ? "bg-destructive/20 text-destructive"
                           : notification.type === "new_episode"
                           ? "bg-success/20 text-success"
                           : "bg-primary/20 text-primary"
                       }`}
                     >
                       <Icon className="w-4 h-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm">{notification.title}</p>
                       <p className="text-xs text-muted-foreground line-clamp-2">
                         {notification.message}
                       </p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {formatDistanceToNow(new Date(notification.created_at), {
                           addSuffix: true,
                         })}
                       </p>
                     </div>
                     {!notification.is_read && (
                       <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                     )}
                   </div>
                 </Link>
               );
             })}
           </div>
         )}
       </ScrollArea>
     </motion.div>
   );
 }
 import { createContext, useContext, useEffect, useState, ReactNode } from "react";
 import { User, Session } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Profile {
   id: string;
   user_id: string;
   username: string;
   display_name: string | null;
   gender: "male" | "female" | "other" | null;
   bio: string | null;
   avatar_url: string | null;
   created_at: string;
   updated_at: string;
 }
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   profile: Profile | null;
   loading: boolean;
   signOut: () => Promise<void>;
   refreshProfile: () => Promise<void>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
 
   const fetchProfile = async (userId: string) => {
     const { data, error } = await supabase
       .from("profiles")
       .select("*")
       .eq("user_id", userId)
       .single();
 
     if (error && error.code !== "PGRST116") {
       console.error("Error fetching profile:", error);
     }
     setProfile(data as Profile | null);
   };
 
   const refreshProfile = async () => {
     if (user) {
       await fetchProfile(user.id);
     }
   };
 
   useEffect(() => {
     // Set up auth state listener FIRST
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
         
         if (session?.user) {
           // Use setTimeout to avoid Supabase deadlock
           setTimeout(() => fetchProfile(session.user.id), 0);
         } else {
           setProfile(null);
         }
         setLoading(false);
       }
     );
 
     // Then check for existing session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (session?.user) {
         fetchProfile(session.user.id);
       }
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const signOut = async () => {
     await supabase.auth.signOut();
     setProfile(null);
   };
 
   return (
     <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
 }
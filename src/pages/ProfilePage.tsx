import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, User, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAnilistAvatars } from "@/hooks/useAnilistAvatars";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    gender: "" as "male" | "female" | "other" | "",
    bio: "",
    avatar_url: "",
  });

  // 🔥 IMPORTANT: Always fetch same avatar pool (NOT gender based)
  const {
    avatars: anilistAvatars,
    loading: avatarsLoading,
  } = useAnilistAvatars(); // constant value

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        display_name: profile.display_name || "",
        gender: profile.gender || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError(
        "Username can only contain letters, numbers, and underscores"
      );
      return false;
    }

    setCheckingUsername(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("user_id", user?.id || "")
      .maybeSingle();

    setCheckingUsername(false);

    if (data) {
      setUsernameError("Username is already taken");
      return false;
    }

    if (error) console.error("Error checking username:", error);

    setUsernameError(null);
    return true;
  };

  const handleSave = async () => {
    if (!user) return;

    const isValidUsername = await checkUsernameAvailability(
      formData.username
    );
    if (!isValidUsername) return;

    setSaving(true);

    try {
      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update({
            username: formData.username,
            display_name: formData.display_name || null,
            gender: formData.gender || null,
            bio: formData.bio || null,
            avatar_url: formData.avatar_url || null,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert({
          user_id: user.id,
          username: formData.username,
          display_name: formData.display_name || null,
          gender: formData.gender || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
        });

        if (error) throw error;
      }

      await refreshProfile();
      toast.success("Profile saved successfully!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const generateRandomAvatar = () => {
    if (anilistAvatars.length === 0) return;

    const randomIndex = Math.floor(
      Math.random() * anilistAvatars.length
    );

    setFormData((prev) => ({
      ...prev,
      avatar_url: anilistAvatars[randomIndex],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
            Profile Settings
          </h1>

          <div className="bg-card rounded-2xl p-4 sm:p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarImage src={formData.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {formData.username?.charAt(0).toUpperCase() || (
                    <User className="w-8 h-8" />
                  )}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="outline"
                size="sm"
                onClick={generateRandomAvatar}
                className="gap-2"
                disabled={anilistAvatars.length === 0}
              >
                <RefreshCw className="w-4 h-4" />
                Random Avatar
              </Button>
            </div>

            {/* Avatar Grid */}
            <div>
              <Label className="mb-2 block">Choose Avatar</Label>

              {avatarsLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-full shimmer"
                    />
                  ))}
                </div>
              ) : anilistAvatars.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {anilistAvatars.map((avatar, index) => (
                    <button
                      key={avatar}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          avatar_url: avatar,
                        }))
                      }
                      className={`p-1 rounded-lg transition-all ${
                        formData.avatar_url === avatar
                          ? "ring-2 ring-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-full overflow-hidden bg-muted">
                        <img
                          src={avatar}
                          alt={`Avatar ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No avatars available. Try again later.
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>

              <Input
                id="username"
                value={formData.username}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                  setUsernameError(null);
                }}
                onBlur={() =>
                  checkUsernameAvailability(formData.username)
                }
                placeholder="unique_username"
                className="bg-muted/50"
              />

              {checkingUsername && (
                <p className="text-sm text-muted-foreground">
                  Checking availability...
                </p>
              )}

              {usernameError && (
                <p className="text-sm text-destructive">
                  {usernameError}
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>

              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                placeholder="Your display name"
                className="bg-muted/50"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>

              <Select
                value={formData.gender}
                onValueChange={(value: "male" | "female" | "other") =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: value,
                  }))
                }
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>

              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                placeholder="Tell us about yourself..."
                className="bg-muted/50 min-h-[100px]"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formData.username ||
                !!usernameError
              }
              className="w-full gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

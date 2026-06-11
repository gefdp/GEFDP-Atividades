import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

function mapUser(authUser, profile) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    full_name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0],
    avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    leader_music_url: profile?.leader_music_url || null,
    job_title: profile?.job_title || null,
    role: profile?.role || "user",
  };
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) throw error;
    setProfile(data);
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    setSession(data.session);
    await loadProfile(data.session?.user);
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setIsLoadingAuth(true);
        setAuthError(null);
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session);
        await loadProfile(data.session?.user);
      } catch (error) {
        if (!mounted) return;
        setAuthError({ type: "auth_error", message: error.message });
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      try {
        await loadProfile(nextSession?.user);
      } catch (error) {
        setAuthError({ type: "profile_error", message: error.message });
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      if (!session?.user) throw new Error("UsuÃ¡rio nÃ£o autenticado.");
      const payload = {
        id: session.user.id,
        email: session.user.email,
        ...data,
      };
      const { data: updated, error } = await supabase
        .from("profiles")
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      setProfile(updated);
      return updated;
    },
    [session?.user]
  );

  const user = useMemo(() => mapUser(session?.user, profile), [session?.user, profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        logout,
        updateProfile,
        refreshUser,
        checkAppState: refreshUser,
        navigateToLogin: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};


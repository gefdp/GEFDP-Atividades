import { useAuth } from "@/lib/AuthContext";

export function useCurrentUser() {
  const { user, isLoadingAuth } = useAuth();
  const isDeveloper = user?.role === "developer";
  const isAdminOnly = user?.role === "admin";
  const isAdmin = isDeveloper || isAdminOnly;
  const isAccessManager = isDeveloper;
  const isStaff = isAccessManager;

  return { user, isDeveloper, isAdminOnly, isAdmin, isAccessManager, isStaff, isLoading: isLoadingAuth };
}

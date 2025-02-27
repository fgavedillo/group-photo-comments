
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface IssueContextProps {
  isAdmin: boolean;
  currentUserEmail: string | null;
  editingIssueId: number | null;
  setEditingIssueId: (id: number | null) => void;
}

const IssueContext = createContext<IssueContextProps>({
  isAdmin: false,
  currentUserEmail: null,
  editingIssueId: null,
  setEditingIssueId: () => {},
});

export const useIssueContext = () => useContext(IssueContext);

export const IssueContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);

  // Obtener el rol del usuario y su email
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const [roleResponse, userResponse] = await Promise.all([
          supabase.rpc('has_role', { _role: 'admin' }),
          supabase.auth.getUser()
        ]);
        
        if (roleResponse.error) throw roleResponse.error;
        setIsAdmin(!!roleResponse.data);

        if (userResponse.data?.user) {
          setCurrentUserEmail(userResponse.data.user.email);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, []);

  return (
    <IssueContext.Provider
      value={{
        isAdmin,
        currentUserEmail,
        editingIssueId,
        setEditingIssueId,
      }}
    >
      {children}
    </IssueContext.Provider>
  );
};

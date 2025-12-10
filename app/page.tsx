"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MainApp } from "@/components/MainApp";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('member');

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Get profile with organization
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          *,
          default_organization:organizations(*)
        `)
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Get user role in organization
        if (profileData.default_organization_id) {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', profileData.default_organization_id)
            .eq('user_id', user.id)
            .single();

          if (memberData) {
            setUserRole(memberData.role);
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return <MainApp user={user} profile={profile} userRole={userRole} />;
}

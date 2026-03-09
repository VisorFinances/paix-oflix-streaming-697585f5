import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  max_screens: number;
  device_type: string | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data as Subscription | null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const updateSubscription = async (updates: Partial<Subscription>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchSubscription();
  };

  const createSubscription = async (plan: string, maxScreens: number) => {
    if (!user) return;

    // Try upsert
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan,
        max_screens: maxScreens,
        status: 'pending',
      }, { onConflict: 'user_id' });

    if (error) throw error;
    await fetchSubscription();
  };

  const isActive = subscription?.status === 'active';
  const isPending = subscription?.status === 'pending';
  const needsDeviceSelection = isActive && subscription?.max_screens === 1 && !subscription?.device_type;

  return {
    subscription,
    loading,
    isActive,
    isPending,
    needsDeviceSelection,
    updateSubscription,
    createSubscription,
    refetch: fetchSubscription,
  };
}

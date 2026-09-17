import { useMemo, useEffect, useState } from 'react';
import { NAV_ITEMS } from '@/data';
import { reviewsService } from '@/services/reviews.service';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export function useNavItems() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reviewsDue, setReviewsDue] = useState(0);

  useEffect(() => {
    if (!user) {
      setReviewsDue(0);
      return;
    }

    // Fetch initial review stats
    fetchReviewStats();

    // Poll for updates every 2 minutes
    const interval = setInterval(fetchReviewStats, 120000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchReviewStats = async () => {
    try {
      const stats = await reviewsService.getStats();
      setReviewsDue(stats.dueToday);
    } catch (err) {
      console.error('Failed to fetch review stats:', err);
    }
  };

  const navItems = useMemo(() => {
    const labels: Record<string, string> = {
      home: t.nav.home,
      learn: t.nav.learn,
      chess: 'Chess practice',
      review: t.nav.reviews,
      prove: t.nav.prove,
      work: t.nav.work,
      profile: t.nav.profile,
      glossary: t.nav.glossary,
      socratic: t.nav.socratic,
      notifications: t.nav.notifications,
      settings: t.nav.settings,
      teach: 'Teach',
      leaderboard: 'Leaderboard',
    };
    return NAV_ITEMS.map((item) => {
      const localized = { ...item, label: labels[item.id] || item.label };
      // Update review badge
      if (item.id === 'review') {
        return { ...localized, badge: reviewsDue > 0 ? reviewsDue : undefined };
      }
      // Update notifications badge from user data
      if (item.id === 'notifications') {
        return { ...localized, badge: user?.unreadNotifications || undefined };
      }
      return localized;
    });
  }, [reviewsDue, t, user?.unreadNotifications]);

  return navItems;
}

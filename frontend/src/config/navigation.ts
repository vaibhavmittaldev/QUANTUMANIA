import {
  LayoutDashboard,
  GraduationCap,
  Cpu,
  Trophy,
  BarChart3,
  User,
  Settings,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  phaseTag?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'learn',
    label: 'Learn',
    path: '/app/learn',
    icon: GraduationCap
  },
  {
    id: 'quantum-lab',
    label: 'Quantum Lab',
    path: '/app/quantum-lab',
    icon: Cpu
  },
  {
    id: 'practice',
    label: 'Practice',
    path: '/app/practice',
    icon: Trophy
  },
  {
    id: 'progress',
    label: 'Progress',
    path: '/app/progress',
    icon: BarChart3
  }
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    path: '/app/profile',
    icon: User
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/app/settings',
    icon: Settings
  }
];

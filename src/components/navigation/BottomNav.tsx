"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRada } from "@/lib/rada-context";
import styles from "./BottomNav.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: (isActive: boolean) => React.ReactNode;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { unreadMessagesCount, newLikesCount } = useRada();

  const navItems: NavItem[] = [
    {
      label: "Discover",
      href: "/discover",
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.8"}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      label: "Radar & Chats",
      href: "/matches",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.8"}
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      label: "Likes",
      href: "/likes",
      badge: newLikesCount > 0 ? newLikesCount : undefined,
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.8"}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.8"}
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={styles.navBar} aria-label="Main Navigation">
      <div className={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={styles.iconContainer}>
                {item.icon(isActive)}
                {item.badge && item.badge > 0 && (
                  <span className={styles.badge} aria-label={`${item.badge} notifications`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={styles.label}>{item.label}</span>
              {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: "#main-content", label: "Chuyển đến nội dung chính" },
  { href: "#story-content", label: "Chuyển đến nội dung truyện" },
  { href: "#audio-controls", label: "Chuyển đến điều khiển âm thanh" },
  { href: "#exercises", label: "Chuyển đến bài tập" },
  { href: "#vocabulary", label: "Chuyển đến từ vựng" },
  { href: "#navigation", label: "Chuyển đến điều hướng" },
];

export const SkipLinks = React.memo(function SkipLinks({
  links = defaultLinks,
  className,
}: SkipLinksProps) {
  return (
    <nav
      className={cn("skip-links", className)}
      aria-label="Liên kết bỏ qua"
      role="navigation"
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            // Ensure the target element gets focus
            const target = document.querySelector(link.href);
            if (target) {
              e.preventDefault();
              (target as HTMLElement).focus();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
});

// Hook to register skip link targets
export function useSkipLinkTarget(id: string) {
  React.useEffect(() => {
    const element = document.getElementById(id);
    if (element && !element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
    }
  }, [id]);

  return { id, tabIndex: -1 };
}

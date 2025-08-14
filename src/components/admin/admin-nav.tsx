"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Home, Users, Layers, Shield } from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <Home className="h-4 w-4 mr-2" />,
  },
  {
    title: "I AM",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        description: "Manage user accounts and permissions",
      },
      {
        title: "Roles",
        href: "/admin/iam/roles",
        description: "Manage user roles and access levels",
      },
      {
        title: "Permissions",
        href: "/admin/iam/permissions",
        description: "Manage system permissions",
      },
    ],
    icon: <Users className="h-4 w-4 mr-2" />,
  },
  {
    title: "Content",
    items: [
      {
        title: "Lessons",
        href: "/admin/lessons",
        description: "Manage learning lessons",
      },
      {
        title: "Stories",
        href: "/admin/stories",
        description: "Manage course stories",
      },
      {
        title: "Vocabularies",
        href: "/admin/vocabularies",
        description: "Manage vocabulary lists",
      },
      {
        title: "Quizzes",
        href: "/admin/quizzes",
        description: "Manage quizzes and assessments",
      },
    ],
    icon: <Layers className="h-4 w-4 mr-2" />,
  },
  {
    title: "Policies",
    href: "/admin/policies",
    icon: <Shield className="h-4 w-4 mr-2" />,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList className="flex items-center space-x-1">
        {navItems.map((item) =>
          item.items ? (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuTrigger className="flex items-center gap-2 h-10 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 rounded-md">
                {item.icon}
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1 p-2 md:w-[400px] md:grid-cols-1 lg:w-[500px]">
                  {item.items.map((subItem) => (
                    <li key={subItem.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={subItem.href}
                          className={cn(
                            "block select-none space-y-1 rounded-sm p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            pathname === subItem.href
                              ? "bg-accent text-accent-foreground"
                              : ""
                          )}
                        >
                          <div className="text-sm font-medium leading-none">
                            {subItem.title}
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {subItem.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.title}>
              <Link href={item.href} legacyBehavior passHref>
                <NavigationMenuLink
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : ""
                  )}
                >
                  {item.icon}
                  {item.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

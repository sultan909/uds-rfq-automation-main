"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Package,
  Users,
  Tag,
  PieChart,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "RFQ Management",
    href: "/rfq-management",
    icon: FileText,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "SKU Mapping",
    href: "/sku-mapping",
    icon: Tag,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: PieChart,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function FloatingTrigger() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      className={`fixed left-4 top-4 z-50 transition-opacity duration-200 ${
        state === "expanded" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={toggleSidebar}
    >
      <PanelLeftOpen className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <FloatingTrigger />
      <UISidebar>
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <h1 className="text-xl font-bold">UDS</h1>
              <p className="text-sm text-muted-foreground">
                RFQ Management System
              </p>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </UISidebar>
    </SidebarProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  Package,
  Users,
  Tag,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

// Create a static store that persists between renders and page navigations
// This pattern works better in Next.js than traditional module variables
const store = {
  // Initialize with default values
  isCollapsed: false,
  isInitialized: false,
};

export function Sidebar() {
  const pathname = usePathname();
  // Initialize state from the persistent store
  const [isReady, setIsReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(store.isCollapsed);
  
  // Handle initial hydration and localStorage sync
  useEffect(() => {
    // Skip if already initialized to avoid unnecessary localStorage reads
    if (!store.isInitialized) {
      // Read from localStorage only on first render
      const savedState = localStorage.getItem("sidebarCollapsed");
      // Only update if value exists to avoid unnecessary state changes
      if (savedState !== null) {
        const collapsed = savedState === "true";
        store.isCollapsed = collapsed;
        setIsCollapsed(collapsed);
      }
      store.isInitialized = true;
    }
    
    // Always mark as ready after first render
    setIsReady(true);
  }, []);
  
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    // Update both local state and persistent store
    setIsCollapsed(newState);
    store.isCollapsed = newState;
    // Save to localStorage for persistence across browser sessions
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // Prevent layout shift by maintaining the last known width during SSR and initial hydration
  // This effectively prevents any flicker by keeping the initial render consistent
  const initialWidth = store.isInitialized ? (store.isCollapsed ? 'w-20' : 'w-64') : 'w-64';

  return (
    <div 
      className={`border-r h-screen bg-background min-w-20 z-30 ${
        isReady ? `transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}` : initialWidth
      }`}
      data-state={isCollapsed ? "collapsed" : "expanded"}
    >
      <div className={`border-b flex items-center h-16 relative ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">UDS</h1>
              <p className="text-sm text-muted-foreground truncate">RFQ Management</p>
            </div>
            {isReady && (
              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-md ml-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                aria-label="Collapse sidebar"
                type="button"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-bold">UDS</h1>
            {isReady && (
              <button 
                onClick={toggleSidebar}
                className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                aria-label="Expand sidebar"
                type="button"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const navLink = (
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-2 rounded-md ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
            return (
              <li key={item.href}>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                      <TooltipContent side="right" className="select-none">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  navLink
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
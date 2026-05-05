import { Link, useLocation } from "wouter";
import { Home, Moon, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavBar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tonight", label: "Tonight", icon: Moon },
    { href: "/venues", label: "Venues", icon: MapPin },
    { href: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
        <ul className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href} className="flex-1">
                <Link 
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                >
                  <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop Top Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border h-16 items-center px-8">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold font-display tracking-tight text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              Tonight <span className="text-primary">GC</span>
            </span>
          </Link>
          
          <ul className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "text-muted-foreground"
                    )}
                    data-testid={`nav-desktop-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}

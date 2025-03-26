
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const MenuSection = ({ title, defaultOpen = true, children }: MenuSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-2"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        {title}
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-2 mt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface MenuItemProps {
  icon?: React.ReactNode;
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

export const MenuItem = ({ icon, href, children, active }: MenuItemProps) => {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted",
        active && "bg-muted font-medium text-primary"
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </a>
  );
};

// src/components/layout/Header.tsx

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  backHref?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, backHref, subtitle, action }: HeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3 pt-2">
      <div className="flex items-start gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-900"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

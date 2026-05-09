"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  events: "Eventos",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const trail: { href: string; label: string }[] = [
    { href: "/", label: "Início" },
  ];

  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    trail.push({
      href: acc,
      label: labelMap[seg] ?? seg,
    });
  }

  return (
    <ShadBreadcrumb>
      <BreadcrumbList>
        {trail.map((c, idx) => {
          const isLast = idx === trail.length - 1;
          return (
            <Fragment key={c.href}>
              {idx > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <Link
                    href={c.href}
                    className={cn(
                      "transition-colors hover:text-foreground",
                    )}
                  >
                    {c.label}
                  </Link>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </ShadBreadcrumb>
  );
}

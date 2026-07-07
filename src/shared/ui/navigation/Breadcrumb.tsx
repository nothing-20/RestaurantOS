import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface IBreadcrumbItem {
  label: string;
  to?: string;
}

export interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<IBreadcrumbProps> = ({
  items,
  className
}) => {
  return (
    <nav className={cn("flex items-center space-x-2 text-xs font-semibold select-none text-left", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {item.to && !isLast ? (
              <Link 
                to={item.to} 
                className="text-slate-400 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "text-primary" : "text-slate-400")}>
                {item.label}
              </span>
            )}
            {!isLast ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
            ) : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
export default Breadcrumb;

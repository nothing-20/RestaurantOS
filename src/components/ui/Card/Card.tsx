import React from 'react';
import { cn } from '../../../utils/cn';

export interface ICardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<ICardProps> = ({
  children,
  hoverable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-slate-900/60 border border-slate-800/50 backdrop-blur-md shadow-lg shadow-black/20 rounded-2xl p-6 transition-all duration-300",
        hoverable ? "hover:border-primary/40 hover:bg-slate-900/85 hover:-translate-y-0.5 cursor-pointer shadow-xl shadow-black/35" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;

"use client";

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  color?: 'white' | 'orange' | 'dark' | 'green' | 'purple' | 'yellow' | 'red';
}

export const NeoCard: React.FC<NeoCardProps> = ({ 
  children, 
  className, 
  title, 
  color = 'white',
  ...props 
}) => {
  const bgColors = {
    white: 'bg-white',
    orange: 'bg-brand-orange',
    dark: 'bg-brand-dark text-white',
    green: 'bg-brand-green',
    purple: 'bg-brand-accent',
    yellow: 'bg-yellow-300',
    red: 'bg-brand-red'
  };

  return (
    <div 
      className={cn(
        "border-2 border-black shadow-neo rounded-none p-6 relative", 
        bgColors[color], 
        className
      )} 
      {...props}
    >
      {title && (
        <h3 className={cn("text-xl font-bold mb-4 border-b-2 border-black pb-2 uppercase", color === 'dark' ? 'border-white' : '')}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

interface NeoButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  icon,
  ...props 
}) => {
  const variants = {
    primary: 'bg-brand-orange text-black hover:bg-orange-400',
    secondary: 'bg-white text-black hover:bg-gray-100',
    danger: 'bg-brand-red text-white hover:bg-red-500',
    success: 'bg-brand-green text-black hover:bg-green-400',
    ghost: 'bg-transparent shadow-none border-transparent hover:bg-gray-100 border-0'
  };

  const isGhost = variant === 'ghost';

  return (
    <motion.button
      whileHover={!isGhost ? { x: -2, y: -2, boxShadow: '6px 6px 0px 0px #1D1D1D' } : {}}
      whileTap={!isGhost ? { x: 2, y: 2, boxShadow: '0px 0px 0px 0px #000' } : { scale: 0.95 }}
      transition={{ duration: 0.05, ease: "easeOut" }} 
      className={cn(
        "flex items-center justify-center gap-2 font-bold py-3 px-6 transition-colors",
        !isGhost && "border-2 border-black shadow-neo",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </motion.button>
  );
};

export const NeoInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, onClick, ...props }) => {
  const internalRef = useRef<HTMLInputElement>(null);

  return (
    <input 
      ref={internalRef}
      className={cn(
        "w-full border-2 border-black p-3 font-medium focus:outline-none focus:shadow-neo transition-shadow bg-white placeholder:text-gray-500",
        className
      )}
      onClick={onClick}
      {...props}
    />
  );
};

export const NeoDatePicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}> = ({ value, onChange, className, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 300 }); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < 350;

        setPosition({
            top: showAbove ? rect.top - 340 : rect.bottom + 8,
            left: rect.left,
            width: 300
        });
    }
  }, [isOpen]);

  useEffect(() => {
      if (!isOpen) return;
      const handleScroll = () => setIsOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll, true);
          window.removeEventListener('resize', handleScroll);
      }
  }, [isOpen]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); 
  
  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const changeMonth = (offset: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
        <div 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                "w-full border-2 border-black p-3 font-medium bg-white cursor-pointer flex justify-between items-center hover:shadow-neo transition-shadow select-none",
                !value && "text-gray-500"
            )}
        >
            <span>{value || placeholder || "Select Date"}</span>
            <CalendarIcon className="w-5 h-5" />
        </div>

        {mounted && isOpen && createPortal(
            <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setIsOpen(false)}
            >
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{ top: position.top, left: position.left, width: position.width }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed bg-white border-2 border-black shadow-neo-lg z-[9999] p-4 flex flex-col"
                >
                    <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 border-2 border-black">
                        <button onClick={(e) => changeMonth(-1, e)} className="p-1 hover:bg-gray-200 transition-colors border-2 border-transparent hover:border-black"><ChevronLeft className="w-4 h-4"/></button>
                        <span className="font-black uppercase text-sm tracking-wider">
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={(e) => changeMonth(1, e)} className="p-1 hover:bg-gray-200 transition-colors border-2 border-transparent hover:border-black"><ChevronRight className="w-4 h-4"/></button>
                    </div>

                    <div className="grid grid-cols-7 mb-2 gap-1">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={`${d}-${i}`} className="text-center text-xs font-black text-gray-400 h-8 flex items-center justify-center">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="h-9 w-9" />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = value === dateStr;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            
                            return (
                                <button
                                    key={day}
                                    onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                                    className={cn(
                                        "h-9 w-9 flex items-center justify-center text-sm font-bold border-2 transition-all",
                                        isSelected 
                                            ? "bg-brand-orange border-black text-black shadow-neo-sm" 
                                            : "border-transparent hover:bg-gray-100 hover:border-gray-200",
                                        isToday && !isSelected ? "text-brand-orange font-black underline" : ""
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>,
            document.body
        )}
    </div>
  );
}

export const NeoSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => {
  return (
    <div className="relative">
        <select 
        className={cn(
            "w-full border-2 border-black p-3 font-medium focus:outline-none focus:shadow-neo transition-shadow bg-white appearance-none",
            className
        )}
        {...props}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-2 border-black pl-2">
            ▼
        </div>
    </div>
  );
};

export const NeoBadge: React.FC<{ children: React.ReactNode; color?: string; onClick?: () => void }> = ({ children, color = 'bg-brand-accent', onClick }) => {
  return (
    <span 
      onClick={onClick}
      className={cn(
        "px-3 py-1 border-2 border-black text-xs font-bold shadow-neo-sm uppercase inline-flex items-center gap-1", 
        color,
        onClick && "cursor-pointer hover:opacity-80"
      )}
    >
      {children}
    </span>
  );
};

export const NeoProgressBar: React.FC<{ value: number; max: number; color?: string; label?: string }> = ({ value, max, color = 'bg-brand-green', label }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs font-bold mb-1 uppercase">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>}
      <div className="w-full h-6 border-2 border-black bg-white relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full border-r-2 border-black absolute top-0 left-0", color)}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold z-10 mix-blend-difference text-white pointer-events-none">
            {value.toLocaleString()} / {max.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

interface NeoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: number;
}

export const NeoDialog: React.FC<NeoDialogProps> = ({ isOpen, onClose, title, children, zIndex = 50 }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
       document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: zIndex }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-lg"
            style={{ zIndex: zIndex + 1 }}
          >
            <div className="bg-white border-4 border-black shadow-neo-lg p-6 relative max-h-[90vh] flex flex-col">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-brand-orange pb-2 inline-block shrink-0">
                {title}
              </h3>
              
              <div className="overflow-y-auto pr-2 -mr-2 flex-1">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface NeoConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
}

export const NeoConfirmDialog: React.FC<NeoConfirmDialogProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message 
}) => {
    return (
        <NeoDialog isOpen={isOpen} onClose={onClose} title={title} zIndex={100}>
            <div className="space-y-6">
                <div className="flex items-start gap-4 bg-red-50 border-2 border-black p-4">
                    <AlertTriangle className="text-red-600 shrink-0 w-8 h-8" />
                    <p className="font-bold text-gray-800">{message}</p>
                </div>
                <div className="flex gap-4">
                    <NeoButton onClick={onClose} variant="ghost" className="flex-1">
                        Cancel
                    </NeoButton>
                    <NeoButton onClick={onConfirm} variant="danger" className="flex-1">
                        Confirm
                    </NeoButton>
                </div>
            </div>
        </NeoDialog>
    );
}

interface NeoTabsProps {
    tabs: string[];
    active: string;
    onChange: (tab: string) => void;
}

export const NeoTabs: React.FC<NeoTabsProps> = ({ tabs, active, onChange }) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    className={cn(
                        "px-6 py-2 border-2 border-black font-bold uppercase tracking-wider transition-all shadow-neo-sm min-w-[120px]",
                        active === tab 
                            ? "bg-brand-orange text-black translate-x-[2px] translate-y-[2px] shadow-none" 
                            : "bg-white hover:bg-gray-100"
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}

export const AppLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14'
    };
    const innerSizeClasses = {
        sm: 'w-4 h-4 text-[6px]',
        md: 'w-5 h-5 text-[8px]',
        lg: 'w-7 h-7 text-[10px]'
    };
    return (
        <motion.div 
            className={cn("relative bg-brand-orange border-2 border-black shadow-neo-sm flex items-center justify-center cursor-pointer group overflow-hidden", sizeClasses[size], className)}
            whileHover={{ scale: 1.05 }}
        >
            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-around items-end px-1">
                <div className="w-1 h-3 bg-black/20"></div>
                <div className="w-1 h-3 bg-black/20"></div>
                <div className="w-1 h-3 bg-black/20"></div>
            </div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-black/20"></div>
            
            <motion.div 
                className={cn("relative z-10 rounded-full bg-white border-2 border-black flex items-center justify-center font-black", innerSizeClasses[size])}
                initial={{ y: 0 }}
                whileHover={{ y: [0, -4, 0], rotate: 360 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                $
            </motion.div>
        </motion.div>
    );
}

import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'accent'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25': variant === 'default',
            'bg-[var(--color-accent)] text-white hover:bg-[#D97706] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/25': variant === 'accent',
            'border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700': variant === 'outline',
            'hover:bg-slate-100 text-slate-600 hover:text-slate-900': variant === 'ghost',
            'h-11 px-6 py-2': size === 'default',
            'h-9 rounded-xl px-4': size === 'sm',
            'h-14 rounded-3xl px-8 text-base': size === 'lg',
            'h-11 w-11': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

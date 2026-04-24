import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  className?: string;
}

const variantClass: Record<string, string> = {
  primary:   'btn',
  secondary: 'btn outline',
  ghost:     'btn ghost',
  danger:    'btn danger-btn',
  outline:   'btn outline',
  success:   'btn',
};

const sizeStyle: Record<string, React.CSSProperties> = {
  sm:   { padding: '7px 14px', fontSize: '13px', borderRadius: '10px' },
  md:   { padding: '10px 18px', fontSize: '14px' },
  lg:   { padding: '14px 22px', fontSize: '16px' },
  xl:   { padding: '18px 28px', fontSize: '18px', borderRadius: '18px' },
  icon: { padding: '10px', width: '40px', height: '40px' },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, style, ...props }, ref) => {
    const cls = [variantClass[variant] ?? 'btn', className].filter(Boolean).join(' ');
    return (
      <button
        ref={ref}
        className={cls}
        disabled={disabled || isLoading}
        style={{ ...sizeStyle[size], ...style }}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin" style={{ width: 16, height: 16, flexShrink: 0 }}
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const buttonVariants = (...args: any[]) => 'btn';

export { Button };

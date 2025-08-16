/**
 * @file Reusable button component with variants
 * @module components/ui/button
 *
 * @description
 * A flexible button component built on Radix UI primitives with multiple
 * style variants and sizes. Supports polymorphic rendering through the
 * asChild prop, allowing the button styles to be applied to any element.
 *
 * @remarks
 * Key features:
 * - Multiple visual variants (default, destructive, outline, secondary, ghost, link)
 * - Four size options (default, sm, lg, icon)
 * - Accessible by default with proper focus states
 * - Polymorphic component support via Radix Slot
 * - Tailwind CSS styling with class-variance-authority
 * - Full TypeScript support with proper type inference
 *
 * Built using:
 * - Radix UI Slot for polymorphic components
 * - class-variance-authority (cva) for variant management
 * - Tailwind CSS for styling
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@shared/lib/utils';

/**
 * Button variant configuration using class-variance-authority
 *
 * @description
 * Defines all visual variants and sizes for the button component.
 * Uses cva to manage complex variant combinations efficiently.
 *
 * @remarks
 * Variants:
 * - default: Primary action button with brand colors
 * - destructive: Dangerous actions (delete, remove)
 * - outline: Secondary actions with border
 * - secondary: Alternative secondary style
 * - ghost: Minimal style for less prominent actions
 * - link: Text-only button styled as a link
 *
 * Sizes:
 * - default: Standard button size (h-10)
 * - sm: Small button (h-9)
 * - lg: Large button (h-11)
 * - icon: Square button for icons (h-10 w-10)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props
 *
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 * @extends {VariantProps<typeof buttonVariants>}
 *
 * @property {boolean} [asChild=false] - Render as a child component using Radix Slot
 * @property {string} [variant] - Visual style variant
 * @property {string} [size] - Size variant
 * @property {string} [className] - Additional CSS classes
 *
 * @description
 * Extends native button props with variant system and polymorphic rendering.
 * When asChild is true, button styles are applied to the child element instead
 * of rendering a button element.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button component
 *
 * @component
 * @description
 * A versatile button component with multiple style variants and sizes.
 * Supports polymorphic rendering, allowing button styles to be applied
 * to any element when using the asChild prop.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="destructive" size="lg">
 *   Delete Account
 * </Button>
 *
 * // As a link
 * <Button asChild variant="link">
 *   <a href="/home">Go Home</a>
 * </Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <SettingsIcon className="h-4 w-4" />
 * </Button>
 * ```
 *
 * @param {ButtonProps} props - Button configuration props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Rendered button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

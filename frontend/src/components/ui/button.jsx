import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Button({ className, variant = 'primary', type = 'button', ...props }) {
  const variants = {
    primary: 'primary-button',
    ghost: 'transition hover:text-aqua',
  }

  return <button type={type} className={twMerge(clsx(variants[variant], className))} {...props} />
}

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Input({ className, ...props }) {
  return <input className={twMerge(clsx('field-input', className))} {...props} />
}

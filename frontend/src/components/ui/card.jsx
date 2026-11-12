import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Card({ className, ...props }) {
  return <section className={twMerge(clsx('glass-panel', className))} {...props} />
}

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity as ActivityIcon, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, BriefcaseBusiness,
  ChevronDown, ChevronRight, CreditCard, Database, Eye, EyeOff, Fingerprint,
  Droplets, Flame, GraduationCap, Home, LockKeyhole, LogOut, Plus, Search, Settings,
  ShieldCheck, Smartphone, Sparkles, Sun, Tv,
  Wallet, Wifi, X, Zap,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast, Toaster } from 'sonner'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Button } from './components/ui/button.jsx'
import { Card } from './components/ui/card.jsx'
import { Input } from './components/ui/input.jsx'

const STORAGE_KEY = 'aerobank-account-v1'
const USER_KEY = 'aerobank-user-v1'
const THEME_KEY = 'aerobank-theme-v1'

const initialTransactions = [
  { id: 'tx-1', title: 'Salary payment', subtitle: 'Northstar Studio', category: 'Income', amount: 385000, date: daysAgo(0), icon: 'income', color: 'mint', direction: 'in' },
  { id: 'tx-2', title: 'Grocery store', subtitle: 'Shoprite', category: 'Shopping', amount: -42850, date: daysAgo(0), icon: 'shopping', color: 'peach', direction: 'out' },
  { id: 'tx-3', title: 'Internet plan', subtitle: 'MTN Nigeria', category: 'Bills', amount: -12000, date: daysAgo(1), icon: 'internet', color: 'blue', direction: 'out' },
  { id: 'tx-4', title: 'Dinner with friends', subtitle: 'The Greenhouse', category: 'Food', amount: -28600, date: daysAgo(2), icon: 'food', color: 'pink', direction: 'out' },
  { id: 'tx-5', title: 'Transfer received', subtitle: 'Adaeze Okafor', category: 'Transfer', amount: 75000, date: daysAgo(3), icon: 'transfer', color: 'violet', direction: 'in' },
]

const transactionIcons = {
  income: BriefcaseBusiness,
  shopping: ShoppingBagIcon,
  internet: Wifi,
  food: UtensilsIcon,
  transfer: ArrowDownLeft,
  airtime: Smartphone,
  data: Database,
  electricity: Zap,
  cable: Tv,
  betting: Flame,
  water: Droplets,
  education: GraduationCap,
  send: ArrowUpRight,
}

const serviceOptions = [
  { id: 'send', label: 'Send money', detail: 'Move money locally', icon: ArrowUpRight, color: 'blue', transfer: true },
  { id: 'airtime', label: 'Airtime', detail: 'Recharge any network', icon: Smartphone, color: 'violet', providers: ['MTN', 'Airtel', 'Glo', '9mobile'], recipientLabel: 'Phone number', recipientPlaceholder: 'e.g. 08012345678' },
  { id: 'data', label: 'Buy data', detail: 'Choose your network', icon: Database, color: 'mint', providers: ['MTN', 'Airtel', 'Glo', '9mobile'], recipientLabel: 'Phone number', recipientPlaceholder: 'e.g. 08012345678' },
  { id: 'electricity', label: 'Electricity', detail: 'Pay your power bill', icon: Zap, color: 'peach', providers: ['Ikeja Electric', 'Eko Electric', 'Abuja Electric', 'Kano Electric'], recipientLabel: 'Meter number', recipientPlaceholder: 'Enter your meter number' },
  { id: 'cable', label: 'Cable TV', detail: 'Renew your subscription', icon: Tv, color: 'blue', providers: ['DStv', 'GOtv', 'StarTimes'], recipientLabel: 'Smartcard / IUC number', recipientPlaceholder: 'Enter your decoder number' },
  { id: 'internet', label: 'Internet', detail: 'Pay your internet plan', icon: Wifi, color: 'mint', providers: ['Spectranet', 'Smile', 'Swift Networks'], recipientLabel: 'Account number', recipientPlaceholder: 'Enter your internet account number' },
  { id: 'betting', label: 'Betting', detail: 'Fund your account', icon: Flame, color: 'pink', providers: ['Bet9ja', 'SportyBet', 'NairaBet'], recipientLabel: 'Account ID', recipientPlaceholder: 'Enter your betting account ID' },
  { id: 'water', label: 'Water', detail: 'Pay your water bill', icon: Droplets, color: 'blue', providers: ['Lagos Water Corporation', 'Abuja Water Board'], recipientLabel: 'Customer number', recipientPlaceholder: 'Enter your customer number' },
  { id: 'education', label: 'Education', detail: 'Pay for exam pins', icon: GraduationCap, color: 'violet', providers: ['JAMB ePIN', 'WAEC PIN'], recipientLabel: 'Candidate phone number', recipientPlaceholder: 'Enter candidate phone number' },
]

const navItems = [
  { label: 'Overview', icon: Home },
  { label: 'Payments', icon: ArrowLeftRight },
  { label: 'Cards', icon: CreditCard },
  { label: 'Activity', icon: ActivityIcon },
]

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const overviewPeriods = ['All time', 'Today', 'This week', 'This month', 'This year']
const weeklyPeriods = ['This week', 'Last week', 'This month']

function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(10 + (days % 8), 18, 0, 0)
  return date.toISOString()
}

function getPeriodBounds(period, now = new Date()) {
  const start = new Date(now)
  const end = new Date(now)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (period === 'Today') return { start, end }
  if (period === 'This week' || period === 'Last week') {
    const daysFromMonday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - daysFromMonday + (period === 'Last week' ? -7 : 0))
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (period === 'This month') {
    start.setDate(1)
    return { start, end }
  }
  if (period === 'This year') {
    start.setMonth(0, 1)
    return { start, end }
  }
  return null
}

function inPeriod(transaction, period, now = new Date()) {
  const bounds = getPeriodBounds(period, now)
  if (!bounds) return true
  const date = new Date(transaction.date)
  return date >= bounds.start && date <= bounds.end
}

function ShoppingBagIcon(props) {
  return <CreditCard {...props} />
}

function UtensilsIcon(props) {
  return <Sparkles {...props} />
}

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function loadAccount() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const account = { balance: 250000, transactions: initialTransactions }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
      return account
    }
    const parsed = JSON.parse(stored)
    if (typeof parsed.balance !== 'number' || !Array.isArray(parsed.transactions)) throw new Error('Invalid saved account')
    return parsed
  } catch (error) {
    console.error('Unable to load AeroBank account data.', error)
    return { balance: 250000, transactions: initialTransactions }
  }
}

function loadUser() {
  try {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Unable to load AeroBank user data.', error)
    return null
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) !== 'light'
  } catch (error) {
    console.error('Unable to load AeroBank theme preference.', error)
    return true
  }
}

function Brand({ compact = false }) {
  return (
    <div className={cn('flex items-center gap-2.5', compact && 'gap-2')}>
      <div className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </div>
      <span className="font-display text-[19px] font-semibold tracking-[-0.055em]">aero<span className="text-aqua">bank</span></span>
    </div>
  )
}

function Login({ onLogin, dark, onTheme }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function submit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || !email.trim()) return
    onLogin({ name: trimmedName, email: email.trim() })
  }

  return (
    <main className="login-screen">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="absolute left-5 right-5 top-5 flex items-center justify-between sm:left-10 sm:right-10 sm:top-8">
        <Brand />
        <button className="icon-button" onClick={onTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
          {dark ? <Sun size={18} /> : <Sparkles size={18} />}
        </button>
      </header>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="login-card">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua/10 text-aqua">
          <Fingerprint size={25} strokeWidth={1.6} />
        </div>
        <p className="eyebrow mb-2">YOUR MONEY, IN MOTION</p>
        <h1 className="font-display text-[31px] font-semibold tracking-[-0.055em]">Banking, beautifully simple.</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Sign in to your AeroBank account.</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="field-label">Your name
            <Input autoComplete="name" placeholder="e.g. Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="field-label">Email address
            <Input autoComplete="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <Button type="submit" className="mt-2 w-full">Continue to AeroBank <ChevronRight size={17} /></Button>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <LockKeyhole size={13} className="text-aqua" /> Simple banking, made for you
        </div>
        </Card>
      </motion.div>
      <p className="absolute bottom-5 px-4 text-center text-[11px] text-muted">Preview only. No real money is held or moved.</p>
    </main>
  )
}

function TransactionSheet({ service, balance, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const transfer = service?.transfer
  const recipientLabel = transfer ? 'Recipient name or account' : service?.recipientLabel
  const numericAmount = Number(amount)

  function submit(event) {
    event.preventDefault()
    if (!recipient.trim()) {
      setError(`Enter a ${recipientLabel.toLowerCase()}.`)
      return
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (numericAmount > balance) {
      setError('This amount is higher than your available balance.')
      return
    }
    onConfirm({ amount: numericAmount, recipient: recipient.trim(), note: note.trim(), provider: selectedProvider })
  }

  return (
    <Dialog.Root open={Boolean(service)} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {service && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div className="transaction-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}>
                <div className="sheet-handle" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow mb-1">AEROBANK PAYMENTS</p>
                    <Dialog.Title className="font-display text-[25px] font-semibold tracking-[-0.05em]">{transfer ? 'Send money' : `Pay ${service.label.toLowerCase()}`}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted">Preview only — no real payment will be sent.</Dialog.Description>
                  </div>
                  <Dialog.Close asChild><button className="icon-button -mt-1" aria-label="Close payment sheet"><X size={18} /></button></Dialog.Close>
                </div>
                <form className="mt-7 space-y-4" onSubmit={submit}>
                  {!transfer && <label className="field-label">Provider
                    <select className="field-input" value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)} required>
                      <option value="" disabled>Select a provider</option>
                      {service.providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                    </select>
                  </label>}
                  <label className="field-label">{recipientLabel}
                    <Input autoFocus autoComplete="off" inputMode={['airtime', 'data'].includes(service.id) ? 'tel' : 'text'} placeholder={transfer ? 'Name or account number' : service.recipientPlaceholder} value={recipient} onChange={(event) => { setRecipient(event.target.value); setError('') }} required />
                  </label>
                  <label className="field-label">Amount
                    <div className="amount-field"><span>₦</span><input inputMode="decimal" type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} /></div>
                  </label>
                  <div className="quick-amounts" aria-label="Choose a suggested amount">
                    {[500, 1000, 2000, 5000].map((suggestion) => <button key={suggestion} type="button" className={amount === String(suggestion) ? 'quick-amount quick-amount-active' : 'quick-amount'} onClick={() => { setAmount(String(suggestion)); setError('') }}>₦{suggestion.toLocaleString('en-NG')}</button>)}
                  </div>
                  <label className="field-label">Note <span className="font-normal text-muted">(optional)</span>
                    <input className="field-input" placeholder="What is this payment for?" value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  {error && <p className="text-sm text-rose-400">{error}</p>}
                  <div className="flex items-center justify-between rounded-xl bg-aqua/[0.06] px-4 py-3 text-sm">
                    <span className="text-muted">Available balance</span>
                    <span className="font-semibold">{money.format(balance)}</span>
                  </div>
                  <Button className="w-full" type="submit">Confirm payment <ArrowUpRight size={17} /></Button>
                </form>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted"><ShieldCheck size={13} className="text-aqua" /> Review the details before confirming</p>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function PeriodSelector({ value, options, onChange, label }) {
  function selectPeriod(event, option) {
    onChange(option)
    event.currentTarget.closest('details').open = false
  }

  return (
    <details className="period-menu">
      <summary className="period-button" aria-label={label}>{value}<ChevronDown size={14} /></summary>
      <div className="period-options">
        {options.map((option) => <button key={option} type="button" className={cn('period-option', option === value && 'period-option-active')} onClick={(event) => selectPeriod(event, option)}>{option}</button>)}
      </div>
    </details>
  )
}

function SettingsDialog({ open, onClose, dark, onTheme, notificationsEnabled, onToggleNotifications, onLogout }) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="settings-overlay" />
        <Dialog.Content className="settings-dialog">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">PREFERENCES</p>
              <Dialog.Title className="font-display text-[25px] font-semibold tracking-[-0.05em]">Settings</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">Manage your appearance and notifications.</Dialog.Description>
            </div>
            <Dialog.Close asChild><button className="icon-button" aria-label="Close settings"><X size={18} /></button></Dialog.Close>
          </div>
          <div className="settings-options">
            <div className="settings-row">
              <div><p className="text-sm font-semibold">Appearance</p><p className="mt-1 text-xs text-muted">Currently using {dark ? 'dark' : 'light'} mode</p></div>
              <button className="settings-action" onClick={onTheme}>{dark ? <Sun size={16} /> : <Sparkles size={16} />}{dark ? 'Light mode' : 'Dark mode'}</button>
            </div>
            <div className="settings-row">
              <div><p className="text-sm font-semibold">Notifications</p><p className="mt-1 text-xs text-muted">Show in-app notification messages</p></div>
              <button className={cn('settings-switch', notificationsEnabled && 'settings-switch-on')} role="switch" aria-checked={notificationsEnabled} aria-label="Toggle notifications" onClick={onToggleNotifications}><span /></button>
            </div>
          </div>
          <button className="settings-signout mt-6 w-full" onClick={onLogout}><LogOut size={16} /> Sign out</button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SideNavigation({ active, onNavigate, onLogout, onSettings, user }) {
  return (
    <aside className="side-nav">
      <div className="px-6 pb-9 pt-7"><Brand /></div>
      <p className="eyebrow px-6 pb-3">MENU</p>
      <nav className="space-y-1 px-3">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onNavigate(label)} className={cn('nav-link', active === label && 'nav-link-active')}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Cards' && <span className="nav-new">PREVIEW</span>}
          </button>
        ))}
      </nav>
      <div className="side-nav-bottom">
        <button className="nav-link" onClick={onSettings}><Settings size={18} /><span>Settings</span></button>
        <div className="profile-row">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-[11px] text-muted">Personal account</p></div>
          <button className="icon-button h-8 w-8" onClick={onLogout} aria-label="Log out"><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  )
}

function BalanceCard({ balance, hidden, onToggle, onAdd }) {
  return (
    <motion.section className="balance-card" whileHover={{ y: -3, scale: 1.008 }} transition={{ duration: 0.25 }}>
      <div className="card-mesh" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2 text-white/75"><Wallet size={16} /><span className="text-xs font-medium">Total balance</span></div>
        <button className="balance-eye" onClick={onToggle} aria-label={hidden ? 'Show balance' : 'Hide balance'}>{hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
      </div>
      <div className="relative z-10 mt-4 flex items-baseline gap-2">
        <span className="font-display text-[31px] font-semibold tracking-[-0.06em] text-white xs:text-[35px]">{hidden ? '₦ ••••••' : money.format(balance)}</span>
        <span className="text-[11px] text-white/55">NGN</span>
      </div>
      <div className="relative z-10 mt-5 flex items-end justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Preview account</p><p className="mt-1.5 text-sm tracking-[0.2em] text-white/85">••••  ••••  4829</p></div>
        <button className="card-add" onClick={onAdd}><Plus size={15} /> Add money</button>
      </div>
      <div className="card-chip"><span /><span /><span /><span /></div>
      <div className="card-orbit" />
    </motion.section>
  )
}

function OverviewChart({ transactions, period }) {
  const now = new Date()
  const bounds = getPeriodBounds(period, now)
  let buckets
  if (period === 'This month') {
    const count = Math.ceil(bounds.end.getDate() / 7)
    buckets = Array.from({ length: count }, (_, index) => ({ day: `W${index + 1}`, startDay: index * 7 + 1, total: 0 }))
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      if (date >= bounds.start && date <= bounds.end && transaction.amount > 0) {
        const bucket = Math.floor((date.getDate() - 1) / 7)
        buckets[bucket].total += transaction.amount
      }
    })
  } else {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(bounds.start)
      date.setDate(date.getDate() + index)
      const total = transactions.reduce((sum, item) => new Date(item.date).toDateString() === date.toDateString() ? sum + Math.max(item.amount, 0) : sum, 0)
      return { day: format(date, 'EEEEE'), total }
    })
  }
  const max = Math.max(...buckets.map((bucket) => bucket.total), 1)

  return (
    <div className="chart-area" aria-label={`Incoming payments for ${period.toLowerCase()}`}>
      <div className="chart-guides"><span /><span /><span /></div>
      <div className="chart-bars">
        {buckets.map((bucket, index) => <div className="chart-column" key={`${bucket.day}-${index}`}><div className={cn('chart-bar', bucket.total > 0 && 'chart-bar-active')} style={{ height: `${Math.max(8, bucket.total / max * 100)}%` }} title={money.format(bucket.total)} /><span>{bucket.day}</span></div>)}
      </div>
    </div>
  )
}

function Transactions({ transactions }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAll, setShowAll] = useState(false)
  const filtered = useMemo(() => transactions.filter((item) => {
    const matchesQuery = `${item.title} ${item.subtitle} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'All' || (filter === 'Income' ? item.amount > 0 : item.amount < 0))
  }), [transactions, query, filter])

  return (
    <section className="glass-panel transactions-panel">
      <div className="flex items-center justify-between">
        <div><p className="eyebrow">YOUR ACTIVITY</p><h2 className="section-title mt-1">Recent transactions</h2></div>
        <button onClick={() => setShowAll(!showAll)} className="text-xs font-medium text-aqua transition hover:text-aqua-bright">{showAll ? 'Show less' : 'See all'} <ChevronRight className="inline" size={14} /></button>
      </div>
      <div className="mt-5 flex gap-2">
        <label className="search-field flex-1"><Search size={15} /><input placeholder="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search transactions" /><kbd>⌘ K</kbd></label>
        <label className="filter-select"><span className="sr-only">Filter transactions</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Income</option><option>Spent</option></select><ChevronDown size={13} /></label>
      </div>
      <div className="transaction-list">
        {filtered.length ? filtered.slice(0, showAll ? undefined : 6).map((transaction) => {
          const Icon = typeof transaction.icon === 'string' ? transactionIcons[transaction.icon] || ArrowLeftRight : ArrowLeftRight
          return (
            <div className="transaction-row" key={transaction.id}>
              <div className={cn('transaction-icon', `tone-${transaction.color || 'blue'}`)}><Icon size={17} strokeWidth={1.8} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{transaction.title}</p><p className="mt-1 truncate text-[11px] text-muted">{transaction.subtitle} <span className="px-1">·</span>{formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}</p></div>
              <p className={cn('whitespace-nowrap text-[13px] font-semibold', transaction.amount > 0 ? 'text-emerald-400' : 'text-content')}>{transaction.amount > 0 ? '+' : '−'}{money.format(Math.abs(transaction.amount))}</p>
            </div>
          )
        }) : <div className="py-8 text-center text-sm text-muted">No transactions match your search.</div>}
      </div>
    </section>
  )
}

function RightRail({ transactions, balance, user }) {
  const [period, setPeriod] = useState('This week')
  const bounds = getPeriodBounds(period)
  const income = transactions.reduce((sum, item) => {
    const date = new Date(item.date)
    return date >= bounds.start && date <= bounds.end ? sum + Math.max(0, item.amount) : sum
  }, 0)
  return (
    <aside className="right-rail">
      <section className="rail-section">
        <div className="flex items-center justify-between gap-2"><div><p className="eyebrow">MONEY FLOW</p><h2 className="section-title mt-1">{period}</h2></div><PeriodSelector value={period} options={weeklyPeriods} onChange={setPeriod} label="Select money flow period" /></div>
        <OverviewChart transactions={transactions} period={period} />
        <div className="mt-4 flex items-center justify-between text-xs"><span className="text-muted">Money received</span><span className="font-semibold">{money.format(income)}</span></div>
      </section>
      <section className="rail-section" id="cards">
        <div className="flex items-center justify-between"><div><p className="eyebrow">YOUR CARD</p><h2 className="section-title mt-1">Everyday card</h2></div><span className="text-xs text-muted">Preview</span></div>
        <div className="mini-card mt-4"><div className="mini-card-glow" /><div className="relative z-10 flex items-center justify-between"><Brand compact /><span className="mini-chip" /></div>        <div className="relative z-10 mt-8 text-[13px] tracking-[0.24em]">•••• &nbsp;•••• &nbsp;•••• &nbsp;4829</div><div className="relative z-10 mt-3 flex items-center justify-between text-[10px] text-white/60"><span>{user.name}</span><span>PREVIEW</span></div></div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white/[0.025] px-3.5 py-3"><span className="flex items-center gap-2 text-xs text-muted"><span className="status-dot" /> Card status</span><span className="text-xs font-medium text-aqua">Preview only</span></div>
      </section>
      <div className="text-center text-[10px] text-muted">Available balance <span className="text-content">{money.format(balance)}</span></div>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="page-footer">
      <div className="footer-main">
        <div className="footer-brand"><Brand /><p className="mt-3 max-w-[190px] text-xs leading-5 text-muted">A little more freedom in everything you do.</p></div>
        <div><p className="footer-heading">Explore</p><a href="#services">Bills & transfers</a><a href="#activity">Activity</a></div>
        <div><p className="footer-heading">Account</p><a href="#overview">Overview</a><a href="#cards">Everyday card</a></div>
        <div><p className="footer-heading">AeroBank</p><a href="#overview">Your finances</a><a href="#services">Everyday payments</a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} AeroBank.</span><span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-aqua" /> Built for everyday</span></div>
    </footer>
  )
}

function Dashboard({ user, account, setAccount, onLogout, dark, onTheme }) {
  const [active, setActive] = useState('Overview')
  const [service, setService] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [overviewPeriod, setOverviewPeriod] = useState('All time')
  const mobileMenuRef = useRef(null)
  const periodTransactions = useMemo(
    () => account.transactions.filter((transaction) => inPeriod(transaction, overviewPeriod)),
    [account.transactions, overviewPeriod],
  )

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!mobileMenuRef.current?.contains(event.target)) setMobileMenuOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  function showNotifications() {
    setMobileMenuOpen(false)
    if (notificationsEnabled) toast.info('You’re all caught up!')
  }

  function chooseService(option) {
    setService(option)
  }

  function completePayment({ amount, recipient, note, provider }) {
    if (amount > account.balance) {
      toast.error('Not enough balance', { description: 'Try a smaller amount or add funds to your wallet.' })
      return
    }
    const entry = {
      id: `tx-${Date.now()}`,
      title: service.transfer ? `Transfer to ${recipient}` : `${service.label} — ${provider}`,
      subtitle: note || recipient,
      category: service.transfer ? 'Transfer' : 'Bills',
      amount: -amount,
      date: new Date().toISOString(),
      icon: service.transfer ? 'transfer' : service.id,
      color: service.color,
      direction: 'out',
    }
    const next = { balance: account.balance - amount, transactions: [entry, ...account.transactions] }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      console.error('Unable to save AeroBank account data.', error)
      toast.error('Unable to record this payment. Please try again.')
      return
    }
    setAccount(next)
    setService(null)
    toast.success('Payment recorded', { description: `${money.format(amount)} recorded. No payment was sent to ${provider || recipient}.` })
  }

  function navigate(label) {
    setActive(label)
    const target = { Overview: 'overview', Payments: 'services', Cards: 'cards', Activity: 'activity' }[label]
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="dashboard-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <SideNavigation active={active} onNavigate={navigate} onLogout={onLogout} onSettings={() => setSettingsOpen(true)} user={user} />
      <main className="dashboard-main">
        <header className="topbar" id="overview">
          <div className="topbar-mobile-brand"><Brand /></div>
          <div className="topbar-greeting"><p className="eyebrow">{format(new Date(), 'EEEE, MMMM d').toUpperCase()}</p><h1 className="font-display text-[21px] font-semibold tracking-[-0.05em]">Good morning, {user.name.split(' ')[0]} <span className="wave">✦</span></h1></div>
          <div className="topbar-actions">
            <div className="online-pill"><span /> All systems normal</div>
            <button className="icon-button theme-toggle" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={onTheme}>{dark ? <Sun size={17} /> : <Sparkles size={17} />}</button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={showNotifications}><Bell size={17} /><i /></button>
            <button className="avatar topbar-avatar" aria-label={`Open settings for ${user.name}`} onClick={() => setSettingsOpen(true)}>{user.name.slice(0, 1).toUpperCase()}</button>
            <div className="mobile-actions" ref={mobileMenuRef}>
              <button className="icon-button mobile-actions-toggle" aria-label="Open account menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><ChevronDown size={18} /></button>
              {mobileMenuOpen && <div className="mobile-actions-menu">
                <div className="mobile-menu-profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div></div>
                <button className="mobile-menu-item" onClick={showNotifications}><Bell size={17} /><span>Notifications</span></button>
                <button className="mobile-menu-item" onClick={() => { setMobileMenuOpen(false); onTheme() }}>{dark ? <Sun size={17} /> : <Sparkles size={17} />}<span>Switch to {dark ? 'light' : 'dark'} mode</span></button>
                <button className="mobile-menu-item" onClick={() => { setMobileMenuOpen(false); setSettingsOpen(true) }}><Settings size={17} /><span>Settings</span></button>
                <button className="mobile-menu-item mobile-menu-signout" onClick={() => { setMobileMenuOpen(false); onLogout() }}><LogOut size={17} /><span>Sign out</span></button>
              </div>}
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          <section className="main-column">
            <div className="section-heading"><div><p className="eyebrow">YOUR FINANCES, AT A GLANCE</p><h2 className="section-title mt-1.5">Your overview</h2></div><PeriodSelector value={overviewPeriod} options={overviewPeriods} onChange={setOverviewPeriod} label="Select overview period" /></div>
            <BalanceCard balance={account.balance} hidden={hidden} onToggle={() => setHidden(!hidden)} onAdd={() => toast('Adding funds is not available yet.')}/>
            <div className="summary-grid">
              <div className="summary-card"><div className="summary-icon tone-mint"><ArrowDownLeft size={16} /></div><div><p className="text-[11px] text-muted">Money in</p><p className="mt-1 text-sm font-semibold">{money.format(periodTransactions.reduce((sum, item) => sum + Math.max(0, item.amount), 0))}</p></div><span className="summary-period">{overviewPeriod.toUpperCase()}</span></div>
              <div className="summary-card"><div className="summary-icon tone-peach"><ArrowUpRight size={16} /></div><div><p className="text-[11px] text-muted">Money out</p><p className="mt-1 text-sm font-semibold">{money.format(periodTransactions.reduce((sum, item) => sum + Math.abs(Math.min(0, item.amount)), 0))}</p></div><span className="summary-period">{overviewPeriod.toUpperCase()}</span></div>
            </div>
            <section id="services" className="services-section">
              <div><p className="eyebrow">BILLS & TRANSFERS</p><h2 className="section-title mt-1">What would you like to do?</h2></div>
              <div className="service-grid">
                {serviceOptions.map(({ id, label, detail, icon: Icon, color, ...option }) => <button key={id} className="service-tile" onClick={() => chooseService({ id, label, icon: Icon, color, ...option })}><span className={cn('service-icon', `tone-${color}`)}><Icon size={19} strokeWidth={1.75} /></span><span className="mt-2.5 block truncate text-[12px] font-semibold">{label}</span><span className="mt-1 block truncate text-[10px] text-muted">{detail}</span></button>)}
              </div>
            </section>
            <div id="activity"><Transactions transactions={account.transactions} /></div>
          </section>
          <RightRail transactions={account.transactions} balance={account.balance} user={user} />
        </div>
        <Footer />
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">{navItems.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={cn('bottom-nav-item', active === label && 'bottom-nav-active')} onClick={() => navigate(label)}><Icon size={18} /><span>{label}</span></button>)}</nav>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} dark={dark} onTheme={onTheme} notificationsEnabled={notificationsEnabled} onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)} onLogout={onLogout} />
      <TransactionSheet key={service?.id || 'closed'} service={service} balance={account.balance} onClose={() => setService(null)} onConfirm={completePayment} />
    </div>
  )
}

function App() {
  const [user, setUser] = useState(loadUser)
  const [account, setAccount] = useState(loadAccount)
  const [dark, setDark] = useState(loadTheme)

  function toggleTheme() {
    const next = !dark
    setDark(next)
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch (error) {
      console.error('Unable to save AeroBank theme preference.', error)
      toast.error('Unable to save your theme preference.')
    }
  }

  function login(nextUser) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
      toast.success(`Welcome to AeroBank, ${nextUser.name.split(' ')[0]}.`)
    } catch (error) {
      console.error('Unable to save AeroBank user data.', error)
      toast.error('Unable to save your account details. Please try again.')
    }
  }

  function logout() {
    try {
      localStorage.removeItem(USER_KEY)
      setUser(null)
    } catch (error) {
      console.error('Unable to sign out of AeroBank.', error)
      toast.error('Unable to sign out. Please try again.')
    }
  }

  return (
    <div className={cn('app-root', dark ? 'theme-dark' : 'theme-light')}>
      <Toaster position="top-right" richColors closeButton theme={dark ? 'dark' : 'light'} />
      <AnimatePresence mode="wait">
        {user ? <motion.div key="dashboard" className="app-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard user={user} account={account} setAccount={setAccount} onLogout={logout} dark={dark} onTheme={toggleTheme} /></motion.div> : <motion.div key="login" className="app-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Login onLogin={login} dark={dark} onTheme={toggleTheme} /></motion.div>}
      </AnimatePresence>
    </div>
  )
}

export default App

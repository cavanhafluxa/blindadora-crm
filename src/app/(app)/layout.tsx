import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

import NotificationBell from '@/components/NotificationBell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  // Pass only necessary info to sidebar
  const userEmail = user.email || ''

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-sidebar-bg)] overflow-hidden transition-colors duration-300">
      <Sidebar userEmail={userEmail} userId={user.id} />
      <main className="flex-1 overflow-y-auto w-full h-[calc(100vh-2rem)] my-4 mr-4 rounded-3xl bg-[var(--color-background)] border border-[var(--color-card-border)] shadow-sm relative z-10 custom-scrollbar flex flex-col">
        <div className="absolute top-6 right-8 z-40">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  )
}

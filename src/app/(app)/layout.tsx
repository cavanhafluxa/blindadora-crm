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
    <div className="flex min-h-screen bg-[var(--color-background)] p-4 md:p-6 gap-6 transition-colors duration-300">
      <Sidebar userEmail={userEmail} userId={user.id} />
      <main className="flex-1 min-w-0 overflow-auto relative flex flex-col custom-scrollbar rounded-3xl">
        <div className="absolute top-0 right-4 z-40">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  )
}


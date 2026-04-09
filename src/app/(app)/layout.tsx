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
    <div className="flex min-h-screen">
      <Sidebar userEmail={userEmail} userId={user.id} />
      <main className="flex-1 min-w-0 overflow-auto relative">
        <div className="absolute top-4 right-6 z-40">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  )
}


import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  let user = null;
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (err) {
    console.error('AppLayout: Erro ao obter usuário:', err)
  }


  if (!user) {
    redirect('/login')
  }

  const userEmail = user?.email || ''
  const userId = user?.id || ''

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Floating Pill Sidebar */}
      <Sidebar userEmail={userEmail} userId={userId} />


      {/* Main content area — offset from the fixed sidebar */}
      <main
        className="flex flex-col min-h-screen overflow-y-auto relative custom-scrollbar"
        style={{
          paddingLeft: '112px',   /* left 16px + sidebar 72px + 24px gap */
          paddingRight: '24px',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        {/* Notification bell — top right */}
        <div className="absolute top-6 right-8 z-40">
          <NotificationBell />
        </div>

        {/* Page content */}
        <div className="flex-1 page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}

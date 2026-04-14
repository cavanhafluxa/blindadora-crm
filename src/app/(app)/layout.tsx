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

  const userEmail = user.email || ''

  return (
    /*
     * Root shell: off-white background fills the viewport.
     * The sidebar is position:fixed so we push content with
     * padding-left = sidebar collapsed width (68px) + 20px gap + 20px gutter = 108px
     */
    <div
      className="min-h-screen w-full transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Floating Pill Sidebar */}
      <Sidebar userEmail={userEmail} userId={user.id} />

      {/* Main content area — offset from the fixed sidebar */}
      <main
        className="flex flex-col min-h-screen overflow-y-auto relative custom-scrollbar"
        style={{
          paddingLeft: '108px',   /* sidebar 68px + 20px left + 20px gap */
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

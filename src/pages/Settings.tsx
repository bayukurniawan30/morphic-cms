import Layout from '@/components/Layout'
import { Head, Link } from '@inertiajs/react'
import {
  SettingsIcon,
  MailIcon,
  ShieldCheckIcon,
  DatabaseIcon,
} from 'lucide-react'
import React from 'react'

export default function Settings({ user }: { user?: any }) {
  const settingGroups = [
    {
      title: 'General',
      items: [
        {
          name: 'Project Settings',
          description: 'Manage project metadata and global configurations.',
          icon: SettingsIcon,
          href: '#',
          disabled: true,
        },
      ],
    },
    {
      title: 'Services',
      items: [
        {
          name: 'Email Service',
          description: 'Configure transactional emails via Resend.',
          icon: MailIcon,
          href: '/email-settings',
          disabled: false,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          name: 'API Access',
          description: 'Manage your API keys for third-party integrations.',
          icon: ShieldCheckIcon,
          href: `/users/edit/${user?.id}`,
          disabled: false,
        },
      ],
    },
  ]

  return (
    <Layout user={user}>
      <Head title='Settings | Morphic' />

      <div className='max-w-4xl mx-auto space-y-8 flex flex-col pt-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Centralized configuration for your Morphic CMS instance.
          </p>
        </div>

        <div className='space-y-8 text-sm'>
          {settingGroups.map((group, idx) => (
            <div key={idx} className='space-y-4'>
              <h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1'>
                {group.title}
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {group.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`group p-5 bg-card border rounded-xl shadow-sm transition-all hover:ring-2 hover:ring-primary/20 hover:border-primary/30 flex flex-col ${item.disabled ? 'opacity-50 cursor-not-allowed grayscale pointer-events-none' : ''}`}
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors'>
                        <item.icon className='w-5 h-5 text-primary' />
                      </div>
                      {item.disabled && (
                        <span className='text-[10px] font-bold uppercase tracking-widest bg-muted px-2 py-0.5 rounded text-muted-foreground'>
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className='font-semibold text-foreground group-hover:text-primary transition-colors'>
                        {item.name}
                      </h3>
                      <p className='text-xs text-muted-foreground mt-1.5 leading-relaxed'>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_VERSION } from '@/lib/version'
import { Head, useForm } from '@inertiajs/react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import React from 'react'

export default function Index({ title }: { title: string }) {
  const { data, setData, setError, errors, processing } = useForm({
    email: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('email', '')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError('email', result.error || 'Login failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      window.location.href = '/dashboard'
    } catch (err) {
      setError('email', 'A network error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden relative'>
      <Head title={`Login | ${title}`} />

      {/* Animated Background Elements */}
      <div className='absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-cyan-600/30 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]' />
      <div className='absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite]' />
      <div className='absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite]' />

      <div className='w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700'>
        <div className='text-center mb-4 space-y-4'>
          <div className='inline-flex items-center justify-center w-18 h-18'>
            <Logo className='w-16 h-16 text-primary' />
          </div>
          <div className='flex items-center justify-center space-x-2 mb-6'>
            <h1 className='text-4xl font-black tracking-tighter text-foreground'>
              MORPHIC <span className='text-primary'>CMS</span>
            </h1>
          </div>
          <p className='text-muted-foreground text-lg'>
            Welcome back. Please enter your credentials.
          </p>
        </div>

        <div className='bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl space-y-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1'
              >
                Email Address
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='admin@morphic.cms'
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                className='h-12 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl'
              />
              {errors.email && (
                <p className='text-xs font-bold text-destructive px-1'>
                  {errors.email}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between ml-1'>
                <Label
                  htmlFor='password'
                  title='password'
                  className='text-sm font-bold uppercase tracking-wider text-muted-foreground'
                >
                  Password
                </Label>
                <a
                  href='/forgot-password'
                  className='text-xs font-bold text-primary hover:text-primary/80 transition-colors'
                >
                  Forgot password?
                </a>
              </div>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  required
                  className='h-12 bg-background/50 border-border pr-12 rounded-xl focus:ring-primary focus:border-primary'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 group'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className='flex items-center justify-center space-x-2'>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <span>Sign In to Dashboard</span>
                </div>
              )}
            </Button>
          </form>
        </div>

        <div className='mt-8 text-center space-y-4'>
          <p className='text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold'>
            Headless Content Management System
          </p>
          <p className='text-[10px] font-mono opacity-30'>v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  )
}

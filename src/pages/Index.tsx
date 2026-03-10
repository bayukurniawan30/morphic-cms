import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from '@inertiajs/react'
import React from 'react'

export default function Index({ title }: { title: string }) {
  const { data, setData, setError, errors, processing } = useForm({
    email: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('email', '') // clear previous errors

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

      // Success! The HTTP-only cookie is now set. Redirect to dashboard.
      window.location.href = '/dashboard'
    } catch (err) {
      setError('email', 'A network error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/40 p-4'>
      <div className='w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            {title}
          </h1>
          <p className='text-muted-foreground mt-2'>
            Sign in to manage your content
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='admin@morphic.cms'
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            {errors.email && (
              <p className='text-sm font-medium text-destructive'>
                {errors.email}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='password'>Password</Label>
              <a
                href='/forgot-password'
                className='text-sm font-medium text-primary hover:underline underline-offset-4'
              >
                Forgot password?
              </a>
            </div>
            <Input
              id='password'
              type='password'
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
            />
          </div>

          <Button
            type='submit'
            className='w-full'
            size={'lg'}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}

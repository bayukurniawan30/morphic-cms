import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Head, useForm } from '@inertiajs/react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
} from 'lucide-react'
import React, { useState } from 'react'
import { RESERVED_SLUGS } from '../../config/reserved-slugs'

export default function SignUp({
  title,
  turnstileSiteKey,
}: {
  title: string
  turnstileSiteKey?: string
}) {
  const { data, setData, setError, errors, processing } = useForm({
    name: '',
    username: '',
    email: '',
    password: '',
    workspaceName: '',
    workspaceSlug: '',
  })

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const turnstileContainerRef = React.useRef<HTMLDivElement>(null)

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  const activeTurnstileSiteKey = isLocalhost ? '' : turnstileSiteKey

  React.useEffect(() => {
    if (!activeTurnstileSiteKey || step !== 2) return

    // Inject Turnstile script if not already present
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'turnstile-script'
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    ;(window as any).onloadTurnstileCallback = () => {
      if (turnstileContainerRef.current && (window as any).turnstile) {
        try {
          ;(window as any).turnstile.render(turnstileContainerRef.current, {
            sitekey: activeTurnstileSiteKey,
            callback: (token: string) => {
              setTurnstileToken(token)
            },
            theme: 'dark',
          })
        } catch (e) {
          // ignore double render errors
        }
      }
    }

    if ((window as any).turnstile && turnstileContainerRef.current) {
      try {
        ;(window as any).turnstile.render(turnstileContainerRef.current, {
          sitekey: activeTurnstileSiteKey,
          callback: (token: string) => {
            setTurnstileToken(token)
          },
          theme: 'dark',
        })
      } catch (e) {
        // ignore double render errors
      }
    }
  }, [activeTurnstileSiteKey, step])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setData((prev) => ({
      ...prev,
      workspaceName: val,
      workspaceSlug: val
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]/g, ''),
    }))
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.name || !data.username || !data.email || !data.password) {
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.workspaceName || !data.workspaceSlug) return

    if (RESERVED_SLUGS.has(data.workspaceSlug.toLowerCase().trim())) {
      setError('email', 'This workspace URL slug is reserved and cannot be used.')
      return
    }

    setIsSubmitting(true)
    setError('email', '')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, turnstileToken }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(
          'email',
          result.error || 'Registration failed. Please try again.'
        )
        setIsSubmitting(false)
        if ((window as any).turnstile) {
          ;(window as any).turnstile.reset()
          setTurnstileToken('')
        }
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setError('email', 'A network error occurred. Please try again.')
      setIsSubmitting(false)
      if ((window as any).turnstile) {
        ;(window as any).turnstile.reset()
        setTurnstileToken('')
      }
    }
  }

  if (isSubmitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden relative'>
        <Head title={`Verify Email | ${title || 'Morphic CMS'}`}>
          <link rel='icon' type='image/png' href='/favicon.png' />
        </Head>

        {/* Animated Background Elements */}
        <div className='absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-cyan-600/30 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]' />
        <div className='absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite]' />
        <div className='absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite]' />

        <div className='w-full max-w-md z-10 text-center animate-in fade-in zoom-in-95 duration-700'>
          <div className='bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl space-y-6 text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mx-auto'>
              <Mail className='w-8 h-8 animate-bounce' />
            </div>
            <h2 className='text-2xl font-black text-foreground'>Check your email</h2>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              We sent a verification link to{' '}
              <strong className='text-foreground font-bold'>{data.email}</strong>. Please click
              the link in the email to activate your account.
            </p>
            <div className='pt-4'>
              <Button asChild className='w-full h-11 rounded-xl font-bold'>
                <a href='/login'>Go to Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden relative'>
      <Head title={`Create Account | ${title || 'Morphic CMS'}`}>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </Head>

      {/* Animated Background Elements */}
      <div className='absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-cyan-600/30 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]' />
      <div className='absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite]' />
      <div className='absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite]' />

      <div className='w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700'>
        <div className='text-center mb-6 space-y-4'>
          <div className='inline-flex items-center justify-center w-18 h-18'>
            <Logo className='w-16 h-16 text-primary' />
          </div>
          <div className='flex items-center justify-center space-x-2'>
            <h1 className='text-4xl font-black tracking-tighter text-foreground'>
              MORPHIC <span className='text-primary'>CMS</span>
            </h1>
          </div>
          <p className='text-muted-foreground text-sm max-w-sm mx-auto'>
            {step === 1
              ? 'Get started with a free account in seconds.'
              : 'Configure your first digital content space.'}
          </p>
        </div>

        <div className='bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl space-y-6'>
          {/* Step indicator */}
          <div className='flex items-center justify-between px-1 mb-2'>
            <span className='text-xs font-bold uppercase tracking-wider text-primary'>
              Step {step} of 2
            </span>
            <span className='text-xs text-muted-foreground'>
              {step === 1 ? 'Account details' : 'Workspace setup'}
            </span>
          </div>

          <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-500 rounded-full'
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          {step === 1 ? (
            <form onSubmit={handleNextStep} className='space-y-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='name'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  Full Name
                </Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='Jane Doe'
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  required
                  className='h-11 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='username'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  Username
                </Label>
                <Input
                  id='username'
                  type='text'
                  placeholder='janedoe'
                  value={data.username}
                  onChange={(e) => setData('username', e.target.value)}
                  required
                  className='h-11 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='email'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  Email Address
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='jane@example.com'
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  required
                  className='h-11 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='password'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                    className='h-11 bg-background/50 border-border pr-12 rounded-xl focus:ring-primary focus:border-primary'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              {errors.email && (
                <p className='text-xs font-bold text-destructive px-1'>
                  {errors.email}
                </p>
              )}

              <Button
                type='submit'
                className='w-full h-12 text-sm font-bold rounded-xl mt-4 gap-2 shadow-lg shadow-primary/10'
              >
                <span>Continue</span>
                <ArrowRight className='w-4 h-4' />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='workspaceName'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  Workspace (Tenant) Name
                </Label>
                <Input
                  id='workspaceName'
                  type='text'
                  placeholder='e.g. Acme Corp'
                  value={data.workspaceName}
                  onChange={handleNameChange}
                  required
                  autoFocus
                  className='h-11 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl'
                />
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='workspaceSlug'
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'
                >
                  URL Slug
                </Label>
                <div className='relative'>
                  <Input
                    id='workspaceSlug'
                    type='text'
                    placeholder='acme-corp'
                    value={data.workspaceSlug}
                    onChange={(e) =>
                      setData(
                        'workspaceSlug',
                        e.target.value
                          .toLowerCase()
                          .replace(/ /g, '-')
                          .replace(/[^\w-]/g, '')
                      )
                    }
                    required
                    className='h-11 bg-background/50 border-border focus:ring-primary focus:border-primary rounded-xl pr-20'
                  />
                  <div className='absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest pointer-events-none'>
                    Subdomain
                  </div>
                </div>
                <p className='text-[10px] text-muted-foreground ml-1'>
                  Will resolve as{' '}
                  <strong>
                    {data.workspaceSlug || 'workspace'}.morphic-cms.com
                  </strong>
                </p>
              </div>

              {activeTurnstileSiteKey && (
                <div className='flex justify-center py-2'>
                  <div ref={turnstileContainerRef} />
                </div>
              )}

              {errors.email && (
                <p className='text-xs font-bold text-destructive px-1'>
                  {errors.email}
                </p>
              )}

              <div className='flex gap-3 mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep(1)}
                  className='h-12 w-12 shrink-0 rounded-xl bg-background/50'
                  disabled={isSubmitting}
                >
                  <ArrowLeft className='w-4 h-4' />
                </Button>
                <Button
                  type='submit'
                  className='flex-1 h-12 text-sm font-bold rounded-xl gap-2 shadow-lg shadow-primary/10'
                  disabled={
                    isSubmitting ||
                    (!!activeTurnstileSiteKey && !turnstileToken)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Creating Space...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className='w-4 h-4' />
                      <span>Create Account</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className='mt-6 text-center space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
            <a
              href='/login'
              className='font-bold text-primary hover:text-primary/80 transition-colors'
            >
              Sign In
            </a>
          </p>
          <p className='text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold'>
            Morphic Headless CMS
          </p>
        </div>
      </div>
    </div>
  )
}

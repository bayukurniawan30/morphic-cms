import Layout from '@/components/Layout'
import { CopyIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link, router, useForm } from '@inertiajs/react'
import { Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import React, { useState } from 'react'

export default function Edit({
  userToEdit,
  user,
  abilities = [],
}: {
  userToEdit: any
  user: any
  abilities: any[]
}) {
  const { data, setData, setError, errors } = useForm({
    name: userToEdit?.name || '',
    email: userToEdit?.email || '',
    username: userToEdit?.username || '',
    password: '', // blank by default, only sent if changed
    role: userToEdit?.role || 'editor',
    abilityId: userToEdit?.abilityId ? String(userToEdit.abilityId) : 'none',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isKeyActioning, setIsKeyActioning] = useState(false)
  const [currentKey, setCurrentKey] = useState(userToEdit?.apiKey)
  const [showPassword, setShowPassword] = useState(false)

  // 2FA state
  const isOwnProfile = user?.id === userToEdit?.id
  const [is2faEnabled, setIs2faEnabled] = useState(
    userToEdit?.isTwoFactorEnabled || false
  )
  const [show2faSetup, setShow2faSetup] = useState(false)
  const [show2faDisable, setShow2faDisable] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [totpSecret, setTotpSecret] = useState('')
  const [totpInput, setTotpInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const handleGenerate2fa = async () => {
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' })
      const body = await res.json()
      if (res.ok) {
        setQrCodeDataUrl(body.qrCode)
        setRecoveryCodes(body.recoveryCodes)
        setTotpSecret(body.secret)
        setShow2faSetup(true)
      } else {
        toast.error(body.error || 'Failed to generate 2FA')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handleVerify2fa = async () => {
    try {
      const res = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: totpSecret,
          code: totpInput,
          recoveryCodes,
        }),
      })
      const body = await res.json()
      if (res.ok) {
        setIs2faEnabled(true)
        setShow2faSetup(false)
        setTotpInput('')
        toast.success('Two-Factor Authentication enabled')
      } else {
        toast.error(body.error || 'Invalid code')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handleDisable2fa = async () => {
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })
      const body = await res.json()
      if (res.ok) {
        setIs2faEnabled(false)
        setShow2faDisable(false)
        setPasswordInput('')
        toast.success('Two-Factor Authentication disabled')
      } else {
        toast.error(body.error || 'Incorrect password')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const downloadRecoveryCodes = () => {
    const text = recoveryCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'morphic_recovery_codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('email', '')

    try {
      const payload: any = { ...data }
      if (!payload.password) delete payload.password // Don't send empty password
      if (payload.abilityId === 'none') payload.abilityId = null

      const res = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        setError('email', result.error || 'Failed to update user')
        setIsSubmitting(false)
        return
      }

      window.location.href = '/users'
    } catch (err) {
      setError('email', 'Network error')
      setIsSubmitting(false)
    }
  }

  const generateApiKey = async () => {
    if (
      !confirm(
        'Generating a new API Key will invalidate any previous keys for this user. Continue?'
      )
    )
      return
    setIsKeyActioning(true)
    try {
      const res = await fetch(`/api/users/${userToEdit.id}/api-key`, {
        method: 'POST',
      })
      const body = await res.json()
      if (res.ok) {
        setCurrentKey(body.apiKey)
        toast.success('API Key generated successfully')
        // We do a hard reload or just update state, setting state is enough for UX
        router.reload({ only: ['userToEdit'] })
      } else {
        toast.error(body.error || 'Failed to generate key')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setIsKeyActioning(false)
    }
  }

  const revokeApiKey = async () => {
    if (
      !confirm(
        'Are you sure you want to revoke this API Key? Any apps using it will lose access immediately.'
      )
    )
      return
    setIsKeyActioning(true)
    try {
      const res = await fetch(`/api/users/${userToEdit.id}/api-key`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setCurrentKey(null)
        toast.success('API Key revoked')
        router.reload({ only: ['userToEdit'] })
      } else {
        const body = await res.json()
        toast.error(body.error || 'Failed to revoke key')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setIsKeyActioning(false)
    }
  }

  return (
    <Layout user={user} title='Edit User'>
      <div className='w-full space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>
              Edit User
            </h1>
            <p className='text-muted-foreground mt-1'>
              Update workspace user details.
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link href='/users'>Cancel</Link>
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
          {/* Main Edit Form */}
          <form
            onSubmit={handleSubmit}
            className='bg-card p-6 rounded-xl shadow-sm border space-y-4 md:col-span-2'
          >
            <h3 className='text-lg font-semibold mb-2 text-foreground'>
              Profile Information
            </h3>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='username'>
                Username <span className='text-destructive ml-1'>*</span>
              </Label>
              <Input
                id='username'
                value={data.username}
                onChange={(e) => setData('username', e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>
                Email <span className='text-destructive ml-1'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
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
              <Label htmlFor='password'>Reset Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  placeholder='Leave blank to keep current password'
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='ability'>API Ability</Label>
              <Select
                value={data.abilityId}
                onValueChange={(value) => setData('abilityId', value)}
              >
                <SelectTrigger id='ability' className='w-full'>
                  <SelectValue placeholder='Inherit from Role (None)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None / Default</SelectItem>
                  {abilities.map((ability) => (
                    <SelectItem key={ability.id} value={String(ability.id)}>
                      {ability.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-[10px] text-muted-foreground italic'>
                Controls what this user's API key can do.
              </p>
            </div>

            <div className='pt-4 flex justify-end'>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          <div className='space-y-6 md:col-span-1'>
            {/* Developer Settings Sidebar */}
            <div className='bg-card p-6 rounded-xl shadow-sm border space-y-4'>
              <h3 className='text-lg font-semibold text-foreground'>
                Developer Settings
              </h3>
              <p className='text-sm text-muted-foreground'>
                This API key is required for third-party applications to access
                and modify the collections via our REST API.
              </p>

              <div className='pt-2'>
                {currentKey ? (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Active Key</Label>
                      <div className='relative'>
                        <Input
                          value={currentKey}
                          readOnly
                          className='font-mono text-xs pr-12 bg-muted/30'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='absolute right-1 top-1 h-7 w-7 text-xs'
                          onClick={() => {
                            navigator.clipboard.writeText(currentKey)
                            toast.success('Copied to clipboard!')
                          }}
                        >
                          <CopyIcon className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      className='w-full'
                      onClick={revokeApiKey}
                      disabled={isKeyActioning}
                    >
                      {isKeyActioning ? 'Revoking...' : 'Revoke API Key'}
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='p-4 bg-muted/40 rounded-lg border border-dashed border-border/60 text-center'>
                      <span className='text-sm text-muted-foreground'>
                        No API key assigned to this user.
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                      onClick={generateApiKey}
                      disabled={isKeyActioning}
                    >
                      {isKeyActioning
                        ? 'Generating...'
                        : 'Generate New API Key'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings Sidebar (2FA) */}
            {isOwnProfile && (
              <div className='bg-card p-6 rounded-xl shadow-sm border space-y-4'>
                <h3 className='text-lg font-semibold text-foreground'>
                  Security
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Protect your account with Two-Factor Authentication.
                </p>

                <div className='pt-2'>
                  {is2faEnabled ? (
                    <div className='space-y-4'>
                      <div className='flex items-center space-x-2 text-green-600 bg-green-500/10 p-3 rounded-lg border border-green-500/20'>
                        <ShieldCheck className='w-5 h-5' />
                        <span className='text-sm font-semibold'>
                          2FA is Enabled
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='destructive'
                        className='w-full'
                        onClick={() => setShow2faDisable(true)}
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      <div className='flex items-center space-x-2 text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20'>
                        <ShieldAlert className='w-5 h-5' />
                        <span className='text-sm font-semibold'>
                          2FA is Disabled
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                        onClick={handleGenerate2fa}
                      >
                        Enable 2FA
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={show2faSetup} onOpenChange={setShow2faSetup}>
        <DialogContent className='sm:max-w-[800px] p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-border/60 shadow-2xl'>
          <div className='p-6 space-y-5'>
            <DialogHeader>
              <DialogTitle className='text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight'>
                Secure Your Account
              </DialogTitle>
              <DialogDescription className='text-sm text-muted-foreground/90 mt-1'>
                Set up Two-Factor Authentication to add an extra layer of
                security to your workspace.
              </DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column: QR Code & Verification */}
              <div className='space-y-5 flex flex-col'>
                {/* Step 1 */}
                <div className='space-y-2'>
                  <div className='flex items-center space-x-3 text-foreground font-semibold'>
                    <span className='flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shadow-sm'>
                      1
                    </span>
                    <span className='text-base'>Scan QR Code</span>
                  </div>
                  <p className='text-xs text-muted-foreground leading-relaxed pl-9'>
                    Use Google Authenticator, Authy, or your preferred 2FA app
                    to scan this code.
                  </p>
                  <div className='flex justify-center p-3 bg-white dark:bg-black/20 rounded-xl border border-border/50 shadow-inner ml-9 mt-2'>
                    {qrCodeDataUrl && (
                      <img
                        src={qrCodeDataUrl}
                        alt='QR Code'
                        className='w-32 h-32 rounded-lg shadow-sm mix-blend-multiply dark:mix-blend-normal'
                      />
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className='space-y-2 pt-1'>
                  <div className='flex items-center space-x-3 text-foreground font-semibold'>
                    <span className='flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shadow-sm'>
                      3
                    </span>
                    <span className='text-base'>Verify Code</span>
                  </div>
                  <div className='pl-9'>
                    <Input
                      type='text'
                      placeholder='000000'
                      value={totpInput}
                      onChange={(e) => setTotpInput(e.target.value)}
                      className='h-12 text-center tracking-[0.75em] font-mono text-xl rounded-xl bg-white dark:bg-black/20 border-border/80 focus:border-primary focus:ring-primary/20 transition-all shadow-sm'
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Recovery Codes */}
              <div className='flex flex-col h-full bg-gradient-to-b from-muted/40 to-muted/10 p-5 rounded-2xl border border-border/60 relative overflow-hidden shadow-sm'>
                <div className='flex items-center space-x-3 text-foreground font-semibold relative z-10'>
                  <span className='flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shadow-sm'>
                    2
                  </span>
                  <span className='text-base'>Save Recovery Codes</span>
                </div>

                <p className='text-xs text-muted-foreground relative z-10 mt-2 pl-9 leading-relaxed'>
                  If you lose access to your device, these codes are your{' '}
                  <strong>only</strong> way to log in.
                </p>

                <div className='mt-3 ml-9 bg-background/60 backdrop-blur-md p-3 rounded-xl border border-border/60 text-[11px] font-mono grid grid-cols-2 gap-2 text-center flex-1 content-start relative z-10 shadow-inner'>
                  {recoveryCodes.map((c, i) => (
                    <div
                      key={i}
                      className='py-1.5 px-2 bg-muted/50 rounded-lg text-foreground/90 tracking-wider shadow-sm border border-border/30'
                    >
                      {c}
                    </div>
                  ))}
                </div>

                <div className='space-y-3 relative z-10 mt-auto pt-4 ml-9'>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full rounded-xl h-10 bg-background/50 hover:bg-accent border-border/80 text-xs'
                    onClick={downloadRecoveryCodes}
                  >
                    Download as .txt
                  </Button>
                  <div className='text-amber-600 dark:text-amber-500/90 text-[10px] leading-tight font-medium flex gap-2 items-start bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20'>
                    <ShieldAlert className='w-3.5 h-3.5 shrink-0 mt-0.5' />
                    <p>
                      Store these securely offline or in a password manager. Do
                      not share them.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='pt-4 border-t border-border/40'>
              <Button
                type='button'
                onClick={handleVerify2fa}
                size='lg'
                className='w-full md:w-auto font-bold px-8 h-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-sm'
                disabled={totpInput.length < 6}
              >
                Complete Setup
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={show2faDisable} onOpenChange={setShow2faDisable}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Please enter your password to confirm you want to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-4'>
            <Label>Password</Label>
            <Input
              type='password'
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShow2faDisable(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDisable2fa}>
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

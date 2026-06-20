import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/sonner'
import { Head } from '@inertiajs/react'
import { AlertCircle, CheckCircle2, GlobeIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import React, { useState, FormEvent } from 'react'
import { toast } from 'sonner'

interface FieldOption {
  label: string
  value: string
}

interface FieldDefinition {
  id: string
  name: string
  label: string
  type:
    | 'text'
    | 'textarea'
    | 'date'
    | 'datetime'
    | 'time'
    | 'select'
    | 'email'
    | 'checkbox'
    | 'radio'
  required: boolean
  options?: FieldOption[]
  helperText?: string
  validation?: {
    minLength?: number
    maxLength?: number
  }
}

interface FormDefinition {
  id: number
  name: string
  slug: string
  fields: FieldDefinition[]
  honeypotField?: string
  theme?: {
    themeColor?: string
    headerImageUrl?: string
    customHeaderText?: string
    customFooterText?: string
  }
}

interface PublicFormProps {
  form?: FormDefinition
  error?: string
  formName?: string
  tenantSlug?: string
  turnstileSiteKey?: string
}

const colorPresets: Record<string, { light: string; dark: string }> = {
  slate: { light: '215 25% 27%', dark: '215 20% 65%' },
  emerald: { light: '142 76% 36%', dark: '142 70% 45%' },
  blue: { light: '221 83% 53%', dark: '217 91% 60%' },
  indigo: { light: '239 84% 59%', dark: '239 84% 67%' },
  violet: { light: '263 90% 51%', dark: '263 85% 65%' },
  rose: { light: '347 77% 50%', dark: '347 80% 60%' },
  orange: { light: '24 95% 53%', dark: '24 90% 60%' },
  yellow: { light: '45 93% 47%', dark: '45 85% 55%' },
}

export default function PublicForm({ form, error, formName, tenantSlug, turnstileSiteKey }: PublicFormProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const turnstileContainerRef = React.useRef<HTMLDivElement>(null)

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const activeTurnstileSiteKey = isLocalhost ? '' : turnstileSiteKey

  // Pre-initialize form states with correct default values
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (!form) return {}
    return form.fields.reduce(
      (acc, field) => {
        if (field.type === 'checkbox') {
          acc[field.name] = []
        } else {
          acc[field.name] = ''
        }
        return acc
      },
      {} as Record<string, any>
    )
  })

  React.useEffect(() => {
    if (!activeTurnstileSiteKey) return

    // Inject Turnstile script if not already present
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    // Set callback in window object
    (window as any).onloadTurnstileCallback = () => {
      if (turnstileContainerRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.render(turnstileContainerRef.current, {
            sitekey: activeTurnstileSiteKey,
            callback: (token: string) => {
              setTurnstileToken(token)
            },
            theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          })
        } catch (e) {
          // Ignore render errors
        }
      }
    }

    // Render immediately if script was already loaded
    if ((window as any).turnstile && turnstileContainerRef.current) {
      try {
        (window as any).turnstile.render(turnstileContainerRef.current, {
          sitekey: activeTurnstileSiteKey,
          callback: (token: string) => {
            setTurnstileToken(token)
          },
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        })
      } catch (e) {
        // Already rendered
      }
    }
  }, [activeTurnstileSiteKey, resolvedTheme])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleCheckboxChange = (fieldName: string, optionValue: string, checked: boolean) => {
    const currentValues = (formData[fieldName] as string[]) || []
    let nextValues: string[]
    if (checked) {
      nextValues = [...currentValues, optionValue]
    } else {
      nextValues = currentValues.filter((v) => v !== optionValue)
    }
    handleFieldChange(fieldName, nextValues)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/forms/${tenantSlug}/${form.slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit form.')
        setSubmitting(false)
        // Reset turnstile widget on failure
        if ((window as any).turnstile) {
          (window as any).turnstile.reset()
          setTurnstileToken('')
        }
        return
      }

      setSubmitted(true)
      toast.success('Form response submitted successfully!')
    } catch (err) {
      toast.error('Network error. Please try again.')
      if ((window as any).turnstile) {
        (window as any).turnstile.reset()
        setTurnstileToken('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const themePreset = form?.theme?.themeColor ? colorPresets[form.theme.themeColor] : null

  // Render error card if form not found or storage mode invalid
  if (error) {
    return (
      <div className='min-h-screen w-full flex flex-col justify-between items-center bg-background text-foreground transition-colors duration-300 p-4 md:p-8 font-sans selection:bg-primary/20'>
        <Head title='Access Denied | Morphic CMS' />
        <Toaster position='top-center' />

        {/* Header bar */}
        <header className='w-full max-w-2xl flex justify-between items-center py-4'>
          <div className='flex items-center gap-2 font-bold text-lg tracking-tight text-primary/80'>
            <GlobeIcon className='h-5 w-5 text-primary' />
            <span>Morphic CMS Form</span>
          </div>
          <Button variant='ghost' size='icon' onClick={toggleTheme} className='rounded-full'>
            {resolvedTheme === 'dark' ? <SunIcon className='h-5 w-5' /> : <MoonIcon className='h-5 w-5' />}
          </Button>
        </header>

        {/* Main error card */}
        <main className='w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-300'>
          <div className='bg-card border border-destructive/20 rounded-2xl shadow-xl shadow-destructive/5 overflow-hidden'>
            <div className='h-2 bg-destructive' />
            <div className='p-6 md:p-8 space-y-6 text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive'>
                <AlertCircle className='h-6 w-6' />
              </div>
              <div className='space-y-2'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {formName ? `Form "${formName}" Restricted` : 'Form Not Found'}
                </h1>
                <p className='text-muted-foreground text-sm leading-relaxed'>{error}</p>
              </div>
              <Button asChild className='w-full' variant='outline'>
                <a href='/'>Go to homepage</a>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className='py-6 text-xs text-muted-foreground/60 tracking-wide'>
          {form?.theme?.customFooterText || 'Powered by Morphic CMS'}
        </footer>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className='min-h-screen w-full flex flex-col justify-between items-center bg-background text-foreground transition-colors duration-300 p-4 md:p-8 font-sans selection:bg-primary/20'>
      <Head title={`${form.name} | Morphic Public Form`} />
      <Toaster position='top-center' />

      {themePreset && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${themePreset.light} !important;
            --ring: ${themePreset.light} !important;
          }
          .dark {
            --primary: ${themePreset.dark} !important;
            --ring: ${themePreset.dark} !important;
          }
        `}} />
      )}

      {/* Top Header */}
      <header className='w-full max-w-2xl flex justify-between items-center py-4'>
        <div className='flex items-center gap-2 font-bold text-lg tracking-tight text-primary/80'>
          <GlobeIcon className='h-5 w-5 text-primary' />
          <span>{form.theme?.customHeaderText || 'Morphic CMS Form'}</span>
        </div>
        <Button variant='ghost' size='icon' onClick={toggleTheme} className='rounded-full'>
          {resolvedTheme === 'dark' ? <SunIcon className='h-5 w-5' /> : <MoonIcon className='h-5 w-5' />}
        </Button>
      </header>

      {/* Content wrapper */}
      <main className='w-full max-w-2xl my-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-300'>
        {submitted ? (
          // Success State Card
          <div className='bg-card border rounded-2xl shadow-xl overflow-hidden'>
            <div className='h-2.5 bg-gradient-to-r from-primary to-primary/60' />
            <div className='p-6 md:p-10 space-y-6 text-center animate-in zoom-in-95 duration-500'>
              <div className='mx-auto w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary'>
                <CheckCircle2 className='h-10 w-10 animate-bounce' />
              </div>
              <div className='space-y-2'>
                <h1 className='text-3xl font-extrabold tracking-tight text-foreground'>
                  Thank you!
                </h1>
                <p className='text-muted-foreground text-sm md:text-base leading-relaxed'>
                  Your response to <strong>{form.name}</strong> was submitted successfully and saved in our database.
                </p>
              </div>
              <div className='pt-4'>
                <Button
                  onClick={() => {
                    // Reset fields
                    setFormData(
                      form.fields.reduce(
                        (acc, field) => {
                          if (field.type === 'checkbox') acc[field.name] = []
                          else acc[field.name] = ''
                          return acc
                        },
                        {} as Record<string, any>
                      )
                    )
                    setSubmitted(false)
                  }}
                  variant='outline'
                  className='rounded-xl px-6'
                >
                  Submit another response
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Form Card
          <div className='bg-card border rounded-2xl shadow-xl overflow-hidden space-y-1'>
            {form.theme?.headerImageUrl ? (
              <div className='w-full aspect-[4/1] overflow-hidden border-b'>
                <img src={form.theme.headerImageUrl} alt="Form Header" className='w-full h-full object-cover' />
              </div>
            ) : (
              <div className='h-2.5 bg-gradient-to-r from-primary to-primary/60' />
            )}
            <div className='p-6 md:p-10 space-y-8'>
              <div className='space-y-2 border-b pb-6'>
                <h1 className='text-3xl font-extrabold tracking-tight text-foreground'>
                  {form.name}
                </h1>
                <p className='text-muted-foreground text-xs font-mono uppercase tracking-widest'>
                  Slug: {form.slug}
                </p>
                <p className='text-xs text-muted-foreground mt-2 italic'>
                  * Indicates required field
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Honeypot anti-spam field */}
                {form.honeypotField && (
                  <div style={{ display: 'none' }} aria-hidden='true'>
                    <label htmlFor={form.honeypotField}>Do not fill this field</label>
                    <input
                      type='text'
                      id={form.honeypotField}
                      name={form.honeypotField}
                      value={formData[form.honeypotField] || ''}
                      onChange={(e) => handleFieldChange(form.honeypotField!, e.target.value)}
                      tabIndex={-1}
                      autoComplete='off'
                    />
                  </div>
                )}

                {/* Form Fields Loop */}
                {form.fields.map((field) => {
                  const fieldLabel = field.label || field.name
                  const isRequired = field.required

                  // 1. Boolean / Switch
                  if (field.type as any === 'boolean') {
                    // Note: Boolean switch representation can be boolean
                    return (
                      <div key={field.id} className='flex items-center space-x-3 py-2 border-b border-muted/30 last:border-b-0'>
                        <Checkbox
                          id={field.name}
                          checked={!!formData[field.name]}
                          onCheckedChange={(checked) => handleFieldChange(field.name, !!checked)}
                        />
                        <Label htmlFor={field.name} className='text-sm font-medium cursor-pointer'>
                          {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                        </Label>
                      </div>
                    )
                  }

                  // 2. Select Option
                  if (field.type === 'select' && field.options) {
                    return (
                      <div key={field.id} className='space-y-2'>
                        <Label htmlFor={field.name} className='text-sm font-semibold'>
                          {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                        </Label>
                        <Select
                          value={formData[field.name]}
                          onValueChange={(val) => handleFieldChange(field.name, val)}
                          required={isRequired}
                        >
                          <SelectTrigger id={field.name} className='rounded-xl h-11'>
                            <SelectValue placeholder={`Choose an option`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label || opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }

                  // 3. Radio Options
                  if (field.type === 'radio' && field.options) {
                    return (
                      <div key={field.id} className='space-y-3'>
                        <Label className='text-sm font-semibold'>
                          {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                        </Label>
                        <RadioGroup
                          value={formData[field.name]}
                          onValueChange={(val) => handleFieldChange(field.name, val)}
                          required={isRequired}
                          className='flex flex-col space-y-2 pl-1'
                        >
                          {field.options.map((opt) => (
                            <div key={opt.value} className='flex items-center space-x-3'>
                              <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
                              <Label htmlFor={`${field.name}-${opt.value}`} className='text-sm font-normal cursor-pointer'>
                                {opt.label || opt.value}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )
                  }

                  // 4. Checkbox Multiple Options
                  if (field.type === 'checkbox' && field.options) {
                    return (
                      <div key={field.id} className='space-y-3'>
                        <Label className='text-sm font-semibold'>
                          {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                        </Label>
                        <div className='flex flex-col space-y-2.5 pl-1'>
                          {field.options.map((opt) => {
                            const isChecked = ((formData[field.name] as string[]) || []).includes(opt.value)
                            return (
                              <div key={opt.value} className='flex items-center space-x-3'>
                                <Checkbox
                                  id={`${field.name}-${opt.value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(field.name, opt.value, !!checked)
                                  }
                                />
                                <Label htmlFor={`${field.name}-${opt.value}`} className='text-sm font-normal cursor-pointer'>
                                  {opt.label || opt.value}
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }

                  // 5. Textarea Fields
                  if (field.type === 'textarea') {
                    return (
                      <div key={field.id} className='space-y-2'>
                        <Label htmlFor={field.name} className='text-sm font-semibold'>
                          {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                        </Label>
                        <Textarea
                          id={field.name}
                          placeholder={`Enter your response`}
                          value={formData[field.name]}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          required={isRequired}
                          className='rounded-xl min-h-[100px] resize-y'
                          minLength={field.validation?.minLength}
                          maxLength={field.validation?.maxLength}
                        />
                        {field.helperText && (
                          <p className='text-xs text-muted-foreground mt-1'>
                            {field.helperText}
                          </p>
                        )}
                      </div>
                    )
                  }

                  // 6. Default Input Field Types (text, date, datetime-local, time, email)
                  let inputType = 'text'
                  if (field.type === 'date') inputType = 'date'
                  else if (field.type === 'datetime') inputType = 'datetime-local'
                  else if (field.type === 'time') inputType = 'time'
                  else if (field.type === 'email') inputType = 'email'

                  return (
                    <div key={field.id} className='space-y-2'>
                      <Label htmlFor={field.name} className='text-sm font-semibold'>
                        {fieldLabel} {isRequired && <span className='text-destructive'>*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type={inputType}
                        placeholder={field.type === 'email' ? 'yourname@example.com' : `Enter your response`}
                        value={formData[field.name]}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={isRequired}
                        className='rounded-xl h-11'
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                      />
                      {field.helperText && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          {field.helperText}
                        </p>
                      )}
                    </div>
                  )
                })}

                {activeTurnstileSiteKey && (
                  <div className='flex justify-center py-2'>
                    <div ref={turnstileContainerRef} />
                  </div>
                )}

                <div className='pt-6 border-t flex justify-end'>
                  <Button
                    type='submit'
                    disabled={submitting || (!!activeTurnstileSiteKey && !turnstileToken)}
                    className='rounded-xl h-11 px-8 font-semibold w-full sm:w-auto transition-transform hover:scale-[1.01] active:scale-[0.99]'
                  >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className='py-6 text-xs text-muted-foreground/60 tracking-wide'>
        {form.theme?.customFooterText || 'Powered by Morphic CMS'}
      </footer>
    </div>
  )
}

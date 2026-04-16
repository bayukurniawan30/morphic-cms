import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import React, { useState } from 'react'

interface Locale {
  id: number
  code: string
  name: string
  isDefault: boolean
}

interface FormProps {
  user: any
  locale?: Locale
  mode: 'create' | 'edit'
}

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
]

export default function Form({ user, locale, mode }: FormProps) {
  const [formData, setFormData] = useState({
    code: locale?.code || '',
    name: locale?.name || '',
    isDefault: locale?.isDefault || false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const url =
      mode === 'create' ? '/api/locales' : `/api/locales/${locale?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          `Language ${mode === 'create' ? 'added' : 'updated'} successfully`
        )
        router.visit('/localization')
      } else {
        toast.error(data.error || 'Failed to save language')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEn = locale?.code === 'en'

  return (
    <Layout user={user}>
      <Head title={`${mode === 'create' ? 'Add' : 'Edit'} Language`} />
      <div className='w-full space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Button variant='ghost' size='icon' asChild>
              <Link href='/localization'>
                <ArrowLeft className='w-5 h-5' />
              </Link>
            </Button>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                {mode === 'create' ? 'Add Language' : 'Edit Language'}
              </h1>
              <p className='text-muted-foreground text-sm uppercase tracking-wider font-medium'>
                {mode === 'create' ? 'New Locale' : `Editing ${locale?.name}`}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-card p-6 rounded-xl shadow-sm border space-y-4 max-w-xl mx-auto lg:mx-0'
        >
          <div className='grid gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Locale Code (ISO 639-1)</Label>
              {mode === 'create' ? (
                <Select
                  value={formData.code}
                  onValueChange={(value) => {
                    const lang = COMMON_LANGUAGES.find((l) => l.code === value)
                    if (lang) {
                      setFormData({
                        ...formData,
                        code: lang.code,
                        name: lang.name,
                      })
                    }
                  }}
                  disabled={isEn}
                >
                  <SelectTrigger className='h-11 font-mono'>
                    <SelectValue placeholder='Select a language code' />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className='flex items-center gap-3'>
                          <span className='text-lg'>{lang.flag}</span>
                          <span>
                            {lang.name} ({lang.code})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id='code'
                  value={formData.code}
                  required
                  disabled={true} // Always disable code change in edit mode for safety
                  className='h-11 font-mono'
                />
              )}
              <p className='text-xs text-muted-foreground'>
                The code used in URLs and API (e.g., 'en', 'id', 'fr').
                {isEn && (
                  <span className='text-primary ml-1'>
                    The 'en' code is protected.
                  </span>
                )}
              </p>
            </div>

            <div className='flex items-center space-x-2 pt-2'>
              <Checkbox
                id='isDefault'
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: !!checked })
                }
                disabled={isEn}
              />
              <div className='grid gap-1.5 leading-none'>
                <Label
                  htmlFor='isDefault'
                  className='text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  Set as default language
                </Label>
                <p className='text-xs text-muted-foreground'>
                  The default language used when no locale is specified.
                </p>
              </div>
            </div>
          </div>

          <div className='pt-6 flex justify-end space-x-3'>
            <Button variant='ghost' asChild disabled={isSubmitting}>
              <Link href='/localization'>Cancel</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Language'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

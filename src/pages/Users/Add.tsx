import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Head, Link, useForm } from '@inertiajs/react'
import { Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'

export default function Add({
  user,
  abilities = [],
}: {
  user: any
  abilities: any[]
}) {
  const { data, setData, post, processing, errors, setError } = useForm({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'editor',
    abilityId: 'none',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('email', '') // reset

    try {
      const payload: any = { ...data }
      if (payload.abilityId === 'none') payload.abilityId = null

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        setError('email', result.error || 'Failed to create user')
        setIsSubmitting(false)
        return
      }

      window.location.href = '/users'
    } catch (err) {
      setError('email', 'Network error')
      setIsSubmitting(false)
    }
  }

  return (
    <Layout user={user}>
      <Head title='Add User' />
      <div className='w-full space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>
              Add User
            </h1>
            <p className='text-muted-foreground mt-1'>
              Create a new user for your workspace.
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link href='/users'>Cancel</Link>
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-card p-6 rounded-xl shadow-sm border space-y-4 max-w-xl mx-auto lg:mx-0'
        >
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder='John Doe'
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
              placeholder='johndoe'
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
              placeholder='john@example.com'
              required
            />
            {errors.email && (
              <p className='text-sm font-medium text-destructive'>
                {errors.email}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>
              Initial Password <span className='text-destructive ml-1'>*</span>
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
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
          </div>

          <div className='pt-4 flex justify-end'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

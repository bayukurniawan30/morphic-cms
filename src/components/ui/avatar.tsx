'use client'

import { cn } from '@/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import {
  Badge,
  Box,
  Club,
  Diamond,
  Hexagon,
  Pyramid,
  Spade,
  Star,
} from 'lucide-react'
import * as React from 'react'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-background',
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const SHAPES = [Badge, Box, Club, Diamond, Hexagon, Pyramid, Spade, Star]
const COLORS = [
  'bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400',
  'bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400',
  'bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-400',
  'bg-purple-50 text-purple-500 dark:bg-purple-950/30 dark:text-purple-400',
  'bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400',
  'bg-pink-50 text-pink-500 dark:bg-pink-950/30 dark:text-pink-400',
  'bg-cyan-50 text-cyan-500 dark:bg-cyan-950/30 dark:text-cyan-400',
  'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400',
]

const getDeterministicIndex = (str: string, max: number) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % max
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const seed = typeof children === 'string' ? children : 'default'
  const shapeIndex = getDeterministicIndex(seed, SHAPES.length)
  const colorIndex = getDeterministicIndex(seed + 'color', COLORS.length)
  const Icon = SHAPES[shapeIndex]

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full',
        COLORS[colorIndex],
        className
      )}
      {...props}
    >
      <Icon className='w-1/2 h-1/2' />
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

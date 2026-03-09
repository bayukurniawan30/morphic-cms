import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  text?: string
}

export function Loader({ size = 24, text, className, ...props }: LoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-2',
        className
      )}
      {...props}
    >
      <Loader2 className='animate-spin text-primary' size={size} />
      {text && (
        <p className='text-sm text-muted-foreground font-medium animate-pulse'>
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingState({
  text = 'Loading media...',
  className,
}: {
  text?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'h-64 flex items-center justify-center bg-card/30 border border-dashed rounded-lg',
        className
      )}
    >
      <Loader text={text} size={32} />
    </div>
  )
}

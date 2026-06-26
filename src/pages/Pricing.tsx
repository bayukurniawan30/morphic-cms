import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Check, Flame, HelpCircle, Sparkles, X } from 'lucide-react'

interface PricingProps {
  user: {
    id: number
    name: string
    email: string
    role: 'super_admin' | 'editor'
    planTier: string
  }
}

export default function Pricing({ user }: PricingProps) {
  const currentPlan = user.planTier || 'FREE'

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/payments/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session.')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred. Please try again.')
    }
  }

  return (
    <Layout user={user} title='Pricing & Plans'>
      <div className='max-w-6xl mx-auto space-y-12 py-4'>
        {/* Header Section */}
        <div className='text-center space-y-4 max-w-2xl mx-auto'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider'>
            <Sparkles className='w-3.5 h-3.5' />
            <span>Morphic Cloud</span>
          </div>
          <h1 className='text-4xl md:text-5xl font-extrabold tracking-tight'>
            Find the perfect plan for your content
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Scale from single developers to team-oriented production projects
            with data isolation, native performance, and zero complex
            infrastructure maintenance.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6'>
          {/* Free Tier Card */}
          <div className='group relative flex flex-col justify-between p-8 rounded-3xl bg-card border border-border shadow-md hover:border-muted-foreground/30 transition-all duration-300 overflow-hidden'>
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold text-foreground'>
                  Freemium Tier
                </h3>
                {currentPlan === 'FREE' && (
                  <span className='px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider text-foreground border border-border'>
                    Current Plan
                  </span>
                )}
              </div>
              <p className='text-muted-foreground text-sm mb-6'>
                For hobby projects, personal portfolios, and evaluating cloud
                capability.
              </p>
              <div className='flex items-baseline gap-1 mb-8'>
                <span className='text-4xl font-extrabold tracking-tight'>
                  $0
                </span>
                <span className='text-muted-foreground text-sm'>/ month</span>
              </div>

              <div className='h-px w-full bg-border mb-8' />

              <ul className='space-y-4 text-sm'>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>20,000</strong> Monthly API Requests
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>500 MB</strong> Storage Limit
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>5</strong> Collections (Schemas)
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>1</strong> Workspace (Tenant)
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>1</strong> User Seat (Admin)
                  </span>
                </li>
                <li className='flex items-start gap-3 text-muted-foreground'>
                  <X className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
                  <span>Localization Systems</span>
                </li>
                <li className='flex items-start gap-3 text-muted-foreground'>
                  <X className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
                  <span>Webhooks Integration</span>
                </li>
                <li className='flex items-start gap-3 text-muted-foreground'>
                  <X className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
                  <span>Form Builder Tool</span>
                </li>
              </ul>
            </div>

            <div className='pt-8'>
              <Button
                variant='outline'
                className='w-full h-12 rounded-xl text-sm font-semibold'
                disabled={currentPlan === 'FREE'}
              >
                {currentPlan === 'FREE' ? 'Active Plan' : 'Free Tier'}
              </Button>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className='group relative flex flex-col justify-between p-8 rounded-3xl bg-card border-2 border-primary/50 shadow-xl shadow-primary/5 hover:border-primary transition-all duration-300 overflow-hidden'>
            {/* Premium Glow effect */}
            <div className='absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[60px] pointer-events-none' />

            <div>
              <div className='flex items-center justify-between mb-4 relative z-10'>
                <h3 className='text-xl font-bold text-foreground flex items-center gap-2'>
                  <span>Pro Plan</span>
                  <Flame className='w-4.5 h-4.5 text-primary animate-pulse' />
                </h3>
                {currentPlan === 'PRO' && (
                  <span className='px-2.5 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30'>
                    Active Plan
                  </span>
                )}
              </div>
              <p className='text-muted-foreground text-sm mb-6 relative z-10'>
                For growing businesses, professional developers, and team
                collaboration.
              </p>
              <div className='flex items-baseline gap-1 mb-8 relative z-10'>
                <span className='text-4xl font-extrabold tracking-tight'>
                  $19
                </span>
                <span className='text-muted-foreground text-sm'>/ month</span>
              </div>

              <div className='h-px w-full bg-border mb-8 relative z-10' />

              <ul className='space-y-4 text-sm relative z-10'>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>500,000</strong> Monthly API Requests
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>5 GB</strong> Storage Limit
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>Unlimited</strong> Collections (Schemas)
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>3</strong> Managed Workspaces
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>Up to 3</strong> Users per Workspace
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>Localization</strong> Systems included
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>Webhooks</strong> Integration included
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                  <span>
                    <strong>Form Builder</strong> Tool included
                  </span>
                </li>
              </ul>
            </div>

            <div className='pt-8 relative z-10'>
              {currentPlan === 'PRO' ? (
                <Button
                  variant='outline'
                  className='w-full h-12 rounded-xl text-sm font-semibold border-primary/30 text-primary hover:bg-primary/5'
                  disabled
                >
                  Active Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  className='w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all'
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Quick Section */}
        <div className='max-w-3xl mx-auto pt-12 space-y-6'>
          <h3 className='text-2xl font-bold tracking-tight text-center flex items-center justify-center gap-2'>
            <HelpCircle className='w-6 h-6 text-muted-foreground' />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className='grid sm:grid-cols-2 gap-6 pt-4'>
            <div className='space-y-2 bg-card/30 p-5 rounded-2xl border border-border/50'>
              <h4 className='font-bold text-foreground text-sm'>
                What happens if I reach the monthly traffic cap?
              </h4>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                If you exceed your monthly limit, your API queries will
                temporarily return a 'Too Many Requests' error. You can upgrade
                to a higher tier at any time to instantly resume operations and
                expand your allowances.
              </p>
            </div>
            <div className='space-y-2 bg-card/30 p-5 rounded-2xl border border-border/50'>
              <h4 className='font-bold text-foreground text-sm'>
                How is workspace ownership computed?
              </h4>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Workspaces inherit features from their creator (owner). If you
                own a workspace and upgrade your account to PRO, that workspace
                instantly gets PRO boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

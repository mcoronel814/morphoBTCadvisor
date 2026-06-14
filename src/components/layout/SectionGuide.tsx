import { ChevronDown, Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SectionGuideProps {
  title: string
  icon?: LucideIcon
  defaultOpen?: boolean
  children: ReactNode
}

export function SectionGuide({
  title,
  icon: Icon = Info,
  defaultOpen = false,
  children,
}: SectionGuideProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent/50">
        <span className="flex items-center gap-2 text-left">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
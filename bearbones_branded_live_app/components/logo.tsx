import Image from 'next/image';
import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function Logo({ compact = false, showSubtitle = true, className }: { compact?: boolean; showSubtitle?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Image
        src={brand.assets.logoHorizontalLight}
        alt={`${brand.company} logo`}
        width={2048}
        height={577}
        priority
        className={cn('h-auto w-full object-contain', compact ? 'max-w-[220px]' : 'max-w-[360px]')}
      />
      {showSubtitle ? (
        <div className="pl-1 text-[11px] font-medium uppercase tracking-[0.34em] text-muted">
          Gear Manager
        </div>
      ) : null}
    </div>
  );
}

import Link from 'next/link'

export interface Breadcrumb {
  label: string
  href?: string
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
}: {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
}) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Ruta" className="mb-2 flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-muted-foreground/60">/</span>}
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

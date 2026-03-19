interface TenantFooterProps {
  orgName: string;
}

export function TenantFooter({ orgName }: TenantFooterProps) {
  const mainUrl = process.env.NEXT_PUBLIC_APP_URL || '/';

  return (
    <footer className="border-t border-border bg-background py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {orgName}</p>
        <p>
          Powered by{' '}
          <a
            href={mainUrl}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reservapp
          </a>
        </p>
      </div>
    </footer>
  );
}

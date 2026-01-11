'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'One number',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'One special character (@ $ ! % * ? &)',
    test: (password) => /[@$!%*?&]/.test(password),
  },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) {
    return null;
  }

  const metRequirements = requirements.filter((req) => req.test(password));
  const strength = metRequirements.length;

  const getStrengthConfig = () => {
    if (strength <= 2) {
      return {
        label: 'Weak',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        width: 'w-1/3',
      };
    }
    if (strength <= 4) {
      return {
        label: 'Medium',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        width: 'w-2/3',
      };
    }
    return {
      label: 'Strong',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      width: 'w-full',
    };
  };

  const config = getStrengthConfig();

   // Detect invalid special characters
  const invalidChars = password
    .split('')  // Split string into array of characters
    .filter(char => {
      // Keep only characters that are NOT letters, numbers, or allowed special chars
      return /[^A-Za-z0-9@$!%*?&]/.test(char);
    })
    .filter((char, index, self) => self.indexOf(char) === index) // Remove duplicates
    .join(', '); // Join with commas

  const hasInvalidChars = invalidChars.length > 0;

  return (
    <div className="space-y-2 text-sm">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Password strength:</span>
          <span className={cn('font-medium', config.textColor)}>
            {config.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', config.color, config.width)}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-1">
        {requirements.map((requirement, index) => {
          const met = requirement.test(password);
          return (
            <li
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                met ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
              )}
            >
              {met ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>

              {/* Invalid character warning */}
        {hasInvalidChars && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              <span className="font-medium">Invalid characters detected:</span>{' '}
              <code className="bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded text-xs">
                {invalidChars}
              </code>
              <br />
              <span className="text-xs mt-1 block">
                Only these special characters are allowed: @ $ ! % * ? &
              </span>
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}

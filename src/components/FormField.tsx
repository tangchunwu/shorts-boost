import { ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, id, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className={cn('text-sm font-medium', error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive animate-fade-in">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export function ValidatedInput({ label, error, hint, required, maxLength, showCount, className, value, ...props }: ValidatedInputProps) {
  const charCount = typeof value === 'string' ? value.length : 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;

  return (
    <FormField label={label} id={props.id} error={error} hint={hint} required={required}>
      <div className="relative">
        <Input
          {...props}
          value={value}
          maxLength={maxLength}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive/30',
            'transition-all duration-200',
            className
          )}
        />
        {showCount && maxLength && (
          <span className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums transition-colors',
            isNearLimit ? 'text-warning' : 'text-muted-foreground/50'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </FormField>
  );
}

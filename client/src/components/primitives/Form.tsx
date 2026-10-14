import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = { label?: string; hint?: string; error?: string; required?: boolean }

export function Field({ label, hint, error, required, children }: FieldProps & { children: ReactNode }) {
  return <div className="field">
    {label && <label className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</label>}
    {children}
    {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
  </div>
}

export function Input({ label, hint, error, required, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label} hint={hint} error={error} required={required}><input className={`input ${error ? 'input-error' : ''}`} {...props} /></Field>
}

export function Textarea({ label, hint, error, required, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Field label={label} hint={hint} error={error} required={required}><textarea className={`textarea ${error ? 'input-error' : ''}`} {...props} /></Field>
}

export function Select({ label, hint, error, required, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return <Field label={label} hint={hint} error={error} required={required}><select className={`select ${error ? 'input-error' : ''}`} {...props}>{children}</select></Field>
}

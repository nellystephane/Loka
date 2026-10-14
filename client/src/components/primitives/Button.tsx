import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary'|'secondary'|'ghost'|'danger'}>;
export function Button({children,variant='primary',className='',...props}: Props){
 return <button className={`button button-${variant} ${className}`.trim()} {...props}>{children}</button>
}

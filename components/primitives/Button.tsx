import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";

type ButtonTone = "red" | "gold" | "green";
type ButtonVariant = "solid" | "text";

type BaseProps = {
  children: ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  className?: string;
};

type LinkButtonProps = BaseProps & {
  href: string;
};

type ActionButtonProps = BaseProps & {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type ButtonProps = LinkButtonProps | ActionButtonProps;

const TONE_SOLID: Record<ButtonTone, string> = {
  red: "bg-brand-red text-ink-inverse hover:bg-brand-red-pressed",
  gold: "bg-brand-gold text-ink hover:bg-brand-gold-deep",
  green: "bg-brand-green text-ink-inverse hover:bg-brand-green-bright",
};

const TONE_TEXT: Record<ButtonTone, string> = {
  red: "text-brand-red border-brand-red",
  gold: "text-brand-gold-deep border-brand-gold-deep",
  green: "text-brand-green border-brand-green",
};

function buttonClasses(tone: ButtonTone, variant: ButtonVariant, className: string) {
  const base = "inline-flex items-center gap-2 font-body font-medium transition-colors";
  if (variant === "solid") {
    return `${base} px-6 py-3 text-sm ${TONE_SOLID[tone]} ${className}`;
  }
  return `${base} border-b-2 pb-0.5 text-base ${TONE_TEXT[tone]} ${className}`;
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function Button(props: ButtonProps) {
  const { children, tone = "red", variant = "solid", className = "" } = props;
  const classes = buttonClasses(tone, variant, className);
  const content =
    variant === "text" ? (
      <>
        {children} <span aria-hidden="true">&rarr;</span>
      </>
    ) : (
      children
    );

  if ("href" in props) {
    if (isExternalHref(props.href)) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={classes}>
      {content}
    </button>
  );
}

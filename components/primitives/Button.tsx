import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";

type ButtonTone = "red" | "gold" | "green";
type ButtonVariant = "solid" | "text";
type ButtonPlane = "light" | "dark";

type BaseProps = {
  children: ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  /*
   * Which page plane the button sits on, so its focus-visible ring can meet
   * WCAG 1.4.11's 3:1 non-text contrast floor either way. Not derived from
   * `tone`: tone is the button's own fill color, unrelated to the page
   * background the outline-offset ring is drawn against. Defaults to
   * "light" because Button's one current call site (app/gallery/error.tsx)
   * sits on the light bg-surface plane; call sites placed on a green or
   * deep-green plane should pass plane="dark".
   */
  plane?: ButtonPlane;
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

/*
 * Branded focus-visible outline, token-based and split by plane so it clears
 * WCAG 1.4.11's 3:1 non-text contrast floor either way. A single gold ring
 * cannot serve both: brand-gold measures only 1.69:1 against the light
 * bg-surface plane, well under the floor, while brand-green measures only
 * 1.91:1 / 1.03:1 against the green / deep-green planes gold is meant for.
 * On bg-surface, brand-green measures 7.05:1; on bg-brand-green and
 * bg-brand-green-deep, brand-gold measures 4.16:1 and 8.19:1.
 *
 * Deliberately not paired with outline-none/outline-hidden: those set
 * Tailwind's shared --tw-outline-style variable to "none" unconditionally,
 * and focus-visible:outline-2 reads that same variable, so the two would
 * cancel out and the ring would never render. outline-style is already
 * "none" at rest (the CSS initial value), so nothing needs suppressing
 * there.
 */
const FOCUS_RING: Record<ButtonPlane, string> = {
  light: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
  dark: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
};

function buttonClasses(
  tone: ButtonTone,
  variant: ButtonVariant,
  plane: ButtonPlane,
  className: string
) {
  const base = `inline-flex items-center gap-2 font-body font-medium transition-colors ${FOCUS_RING[plane]}`;
  if (variant === "solid") {
    return `${base} px-6 py-3 text-sm ${TONE_SOLID[tone]} ${className}`;
  }
  return `${base} border-b-2 pb-0.5 text-base ${TONE_TEXT[tone]} ${className}`;
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function Button(props: ButtonProps) {
  const { children, tone = "red", variant = "solid", plane = "light", className = "" } = props;
  const classes = buttonClasses(tone, variant, plane, className);
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

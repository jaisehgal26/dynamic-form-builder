import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "We replaced Typeform and a spreadsheet in one afternoon. The analytics alone paid for the switch.",
    author: "Sarah Chen",
    role: "Head of Growth, Latticeflow",
  },
  {
    quote:
      "Conditional logic just works. Our onboarding form went from 12 minutes to 4 without losing any data we need.",
    author: "Marcus Webb",
    role: "Product Lead, Northwind",
  },
  {
    quote:
      "Finally a form builder that feels like part of our product — not a bolt-on iframe experience.",
    author: "Priya Nair",
    role: "Founder, Stackline",
  },
];

export function LandingTestimonials() {
  return (
    <section
      id="testimonials"
      className="border-t border-border/60 bg-subtle/40 py-24 sm:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Loved by teams
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for people who ship fast
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.author}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <Quote className="h-8 w-8 text-primary/30" aria-hidden />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-border/60 pt-4">
                <p className="text-sm font-medium">{item.author}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

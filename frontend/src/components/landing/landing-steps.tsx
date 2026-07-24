import { LineChart, Rocket, Wand2 } from "lucide-react";

const steps = [
  {
    icon: Wand2,
    step: "01",
    title: "Design your flow",
    description:
      "Drag fields onto the canvas, set validation rules, and add branching logic in a visual editor.",
  },
  {
    icon: Rocket,
    step: "02",
    title: "Publish instantly",
    description:
      "Get a shareable link the moment you hit publish. Embed anywhere or share directly.",
  },
  {
    icon: LineChart,
    step: "03",
    title: "Learn and iterate",
    description:
      "Watch responses roll in, spot drop-off points, and refine questions with real data.",
  },
];

export function LandingSteps() {
  return (
    <section id="how-it-works" className="py-24 sm:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From blank canvas to live form in three steps
          </h2>
        </div>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden
          />
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <item.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold tabular-nums tracking-widest text-primary">
                STEP {item.step}
              </p>
              <h3 className="mt-2 text-lg font-medium tracking-tightish">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

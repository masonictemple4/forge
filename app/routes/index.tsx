import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Header, ForgeLogo } from "~/components/layout";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
        
        <div className="container mx-auto relative px-4 md:px-6 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/10 rounded-full scale-150" />
              <ForgeLogo className="relative h-20 w-20 md:h-24 md:w-24" />
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Project management,{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  forged for speed
                </span>
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
                Virtualized Kanban boards that handle 10,000+ tasks. 
                Keyboard-first. Blazingly fast.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/board/api">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Social proof / tech stack badges */}
            <div className="flex flex-wrap justify-center gap-2 pt-8 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-muted">React</span>
              <span className="px-3 py-1 rounded-full bg-muted">TanStack</span>
              <span className="px-3 py-1 rounded-full bg-muted">Drizzle</span>
              <span className="px-3 py-1 rounded-full bg-muted">PostgreSQL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Built Different
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Performance isn't an afterthought. It's the foundation.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <FeatureCard
              icon="⚡"
              title="Virtualized Rendering"
              description="Only renders what's visible. Handle 10,000+ cards without breaking a sweat."
            />
            <FeatureCard
              icon="🎯"
              title="LexoRank Ordering"
              description="O(1) card reordering. No renumbering, no cascading updates."
            />
            <FeatureCard
              icon="⌨️"
              title="Keyboard First"
              description="Navigate, create, and manage tasks without touching your mouse."
            />
            <FeatureCard
              icon="🔗"
              title="DAG Dependencies"
              description="Track task dependencies with automatic cycle detection."
            />
            <FeatureCard
              icon="🌲"
              title="Materialized Paths"
              description="Instant subtree queries for nested project structures."
            />
            <FeatureCard
              icon="✨"
              title="Optimistic Updates"
              description="Instant UI feedback. Changes feel immediate, rollback on error."
            />
          </div>
        </div>
      </section>

      {/* Demo Links Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              See It In Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Try our live demos. No sign-up required.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <DemoCard
              to="/board/api"
              title="Live Board"
              badge="API Connected"
              description="Real database with optimistic updates. TanStack Query handles caching and sync."
              highlight
            />
            <DemoCard
              to="/board"
              title="Kanban Demo"
              badge="250 Tasks"
              description="5 columns × 50 tasks. Drag and drop with smooth animations."
            />
            <DemoCard
              to="/board/stress"
              title="Stress Test"
              badge="4,000 Tasks"
              description="20 columns × 200 tasks. Only ~20 items rendered at a time."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ready to forge ahead?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join developers who demand more from their project management tools.
          </p>
          <Link to="/login">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 h-auto"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ForgeLogo className="h-5 w-5" />
            <span className="font-semibold">Forge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ using TanStack, Drizzle, and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
      <CardContent className="p-6 space-y-4">
        <div className="text-4xl">{icon}</div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DemoCard({
  to,
  title,
  badge,
  description,
  highlight = false,
}: {
  to: string;
  title: string;
  badge: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link to={to}>
      <Card
        className={`h-full group hover:shadow-lg transition-all cursor-pointer ${
          highlight ? "border-primary border-2" : ""
        }`}
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
              {title}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {badge}
            </span>
          </div>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

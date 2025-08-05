import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

function CTA(){
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />

      <div className="container text-center space-y-8 relative z-10">
        {/* Social proof */}
        <div className="flex items-center justify-center space-x-1 text-primary mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            Built for students, by students — and it shows
          </span>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold max-w-3xl mx-auto">
            Ready to Transform Your{" "}
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Academic Journey?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students who have already enhanced their productivity and organization.
          </p>
        </div>

      </div>

      {/* Decorative elements */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
    </section>
  );
};

export default CTA;
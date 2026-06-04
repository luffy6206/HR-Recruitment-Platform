import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password is too short"),
});
type FormData = z.infer<typeof schema>;



export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@company.com", password: "Admin@123" },
  });

  async function onSubmit(values: FormData) {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  function quickFill(role: "ADMIN" | "HR") {
    if (role === "ADMIN") form.reset({ email: "admin@company.com", password: "Admin@123" });
    else form.reset({ email: "hr@company.com", password: "Hr@123" });
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(800px 400px at 10% 0%, oklch(0.55 0.24 305 / 0.35), transparent 60%), radial-gradient(600px 600px at 90% 100%, oklch(0.78 0.16 78 / 0.18), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl gradient-primary shadow-glow">
            <Briefcase className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">Talentflow</p>
            <p className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">Recruit OS</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Run hiring like a <span className="text-primary">revenue function</span>.
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-foreground/70">
            Centralize sourcing, screening, interviews and offers. Coach your HR team with real-time
            analytics and ship better hiring outcomes every quarter.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { k: "+38%", v: "Faster time-to-hire" },
              { k: "12k+", v: "Candidates managed" },
              { k: "99.9%", v: "Platform uptime" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3">
                <p className="text-lg font-semibold text-primary">{x.k}</p>
                <p className="text-[11px] text-sidebar-foreground/60">{x.v}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Talentflow Inc. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl gradient-primary shadow-glow">
              <Briefcase className="size-5 text-primary-foreground" />
            </div>
            <p className="text-lg font-semibold">Talentflow</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Sign in to your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access the recruitment console.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                {...form.register("email")}
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                placeholder="you@company.com"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  {...form.register("password")}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Demo accounts</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => quickFill("ADMIN")} className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs transition hover:border-primary/40">
                <p className="font-semibold text-foreground">Admin</p>
                <p className="text-muted-foreground">admin@company.com</p>
              </button>
              <button onClick={() => quickFill("HR")} className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs transition hover:border-primary/40">
                <p className="font-semibold text-foreground">HR</p>
                <p className="text-muted-foreground">hr@company.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

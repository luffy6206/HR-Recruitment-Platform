import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Talentflow" }] }),
  component: () => <AppShell><SettingsPage /></AppShell>,
});

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        defaultValue={defaultValue}
        type={type}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-background/40 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary">
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-card shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function Save() {
  return (
    <div className="flex justify-end pt-4">
      <button onClick={() => toast.success("Saved")} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
        Save changes
      </button>
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Settings" description="Manage your account, workspace and preferences." />
      <Tabs defaultValue="general">
        <TabsList className="bg-card">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Profile</h3>
            <p className="mb-4 text-xs text-muted-foreground">Your basic account details.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" defaultValue={user?.name} />
              <Field label="Email" defaultValue={user?.email} type="email" />
              <Field label="Phone" defaultValue="+91 98XXXXXXXX" />
              <Field label="Role" defaultValue={user?.role} />
            </div>
            <Save />
          </div>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Company</h3>
            <p className="mb-4 text-xs text-muted-foreground">Workspace identity used across emails and reports.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" defaultValue="Talentflow Inc." />
              <Field label="Website" defaultValue="https://talentflow.app" />
              <Field label="Headquarters" defaultValue="Bengaluru, India" />
              <Field label="Industry" defaultValue="SaaS / HR Tech" />
            </div>
            <Save />
          </div>
        </TabsContent>

        <TabsContent value="resume" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Resume parser</h3>
            <p className="mb-4 text-xs text-muted-foreground">Tune resume extraction and storage.</p>
            <div className="space-y-3">
              <Toggle label="Auto-parse new resumes" description="Extract skills, education and experience on upload." defaultChecked />
              <Toggle label="Store original PDF" description="Keep the source file for audit and re-parsing." defaultChecked />
              <Toggle label="Detect duplicates" description="Match by email + phone fingerprint." />
            </div>
            <Save />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Notifications</h3>
            <p className="mb-4 text-xs text-muted-foreground">Choose what lands in your inbox.</p>
            <div className="space-y-3">
              <Toggle label="New candidate assigned" description="Email + in-app." defaultChecked />
              <Toggle label="Interview reminders" description="60 minutes before scheduled time." defaultChecked />
              <Toggle label="Weekly digest" description="Pipeline summary every Monday." />
              <Toggle label="Overdue tasks" description="Notify when tasks pass the due date." defaultChecked />
            </div>
            <Save />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <div className="card-elevated p-6">
            <h3 className="text-base font-semibold">Preferences</h3>
            <p className="mb-4 text-xs text-muted-foreground">Personalize the workspace.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Time zone" defaultValue="Asia/Kolkata (GMT+5:30)" />
              <Field label="Date format" defaultValue="MMM d, yyyy" />
              <Field label="Default landing page" defaultValue="/dashboard" />
              <Field label="Items per page" defaultValue="10" type="number" />
            </div>
            <Save />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

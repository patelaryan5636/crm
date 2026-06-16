import { Link } from "react-router-dom";
import PolicyLayout from "./PolicyLayout";

// ─── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    phase: "Setup",
    color: "#2a465a",
    bgColor: "#e8f0f5",
    steps: [
      {
        n: 1,
        title: "Register Your Company (Admin)",
        summary:
          "Create your organisation's master account. The Admin account is the highest authority within your company on Graphura CRM.",
        details: [
          "Go to the Admin Register page and fill in Company Name, Company Email, and Company Address.",
          "Verify your email via the OTP sent to your inbox.",
          "Set the Admin owner name and a strong password.",
          "Once registered, you will be redirected to the Admin Dashboard.",
        ],
        link: "/admin-register",
        linkLabel: "Go to Register →",
        badge: "Admin",
        badgeColor: "#2563eb",
      },
      {
        n: 2,
        title: "Log In as Admin",
        summary:
          "Access the full Admin Control Center to manage your entire CRM organisation.",
        details: [
          "Visit the Admin Login page.",
          "Enter your registered company email and password.",
          "Complete the CAPTCHA and allow location access.",
          "You will land on the Admin Dashboard.",
        ],
        link: "/admin-login",
        linkLabel: "Go to Admin Login →",
        badge: "Admin",
        badgeColor: "#2563eb",
      },
    ],
  },
  {
    phase: "Department & Team Setup",
    color: "#7c3aed",
    bgColor: "#f3f0ff",
    steps: [
      {
        n: 3,
        title: "Create Departments",
        summary:
          "Divide your workspace into functional departments — Sales, Finance, and Management.",
        details: [
          "From the Admin Dashboard navigate to User Management → Departments.",
          "Create at least one Sales department to activate lead management.",
          "Each department gets its own workspace and access controls.",
          "Department names are visible to all users assigned to them.",
        ],
        link: "/admin/users",
        linkLabel: "Go to User Management →",
        badge: "Admin",
        badgeColor: "#2563eb",
      },
      {
        n: 4,
        title: "Create Users & Assign Roles",
        summary:
          "Add team members to your organisation and assign them the correct role for their responsibilities.",
        details: [
          "Navigate to Admin → User Management → Add User.",
          "Assign roles: Sales Manager, Sales Team Leader, Sales Executive, Finance Manager, Management Manager, etc.",
          "Each user receives an email with their temporary credentials.",
          "Users must complete the Department Workspace setup on first login.",
        ],
        link: "/admin/users",
        linkLabel: "Manage Users →",
        badge: "Admin",
        badgeColor: "#2563eb",
      },
      {
        n: 5,
        title: "Department First-Time Login & Setup",
        summary:
          "When a department user (any role except Admin/Super Admin) logs in for the first time, they complete a two-step account setup.",
        details: [
          "User visits the Department Sign In page and logs in with their credentials.",
          "Step 1 — Set a new personal password (minimum 8 characters).",
          "Step 2 — Enter bank details (account number, IFSC, bank name) for payroll.",
          "After completion the user is automatically redirected to their role-specific dashboard.",
        ],
        link: "/login",
        linkLabel: "Go to Department Login →",
        badge: "All Roles",
        badgeColor: "#0891b2",
      },
    ],
  },
  {
    phase: "Lead Management",
    color: "#d97706",
    bgColor: "#fffbeb",
    steps: [
      {
        n: 6,
        title: "Admin Uploads Leads",
        summary:
          "The Admin bulk-uploads leads via CSV into the central lead pool. This is the top of the lead distribution funnel.",
        details: [
          "Navigate to Admin → Leads & Sales → Leads → Bulk Upload.",
          "Download the CSV template and fill in lead details (name, phone, email, source, etc.).",
          "Upload the CSV — the system validates and imports the records.",
          "Maximum lead capacity per company instance is configurable (default limit: 6,000 leads).",
          "Duplicate detection runs automatically during import.",
        ],
        link: "/admin/leads",
        linkLabel: "Go to Leads →",
        badge: "Admin",
        badgeColor: "#2563eb",
        limit: "Max: 6,000 leads per company",
      },
      {
        n: 7,
        title: "Sales Manager Distributes Leads to Team Leaders",
        summary:
          "The Sales Manager receives leads from the Admin pool and distributes them across Team Leaders.",
        details: [
          "Log in as Sales Manager at the Department Sign In.",
          "Navigate to Sales Manager → Leads.",
          "Select leads from the unassigned pool and assign them to specific Team Leaders.",
          "Each Team Leader can hold a maximum of 1,500 leads at a time.",
          "The Sales Manager can also upload additional leads via bulk CSV import.",
          "Monitor distribution balance using the Leads dashboard.",
        ],
        link: "/login",
        linkLabel: "Sales Manager Login →",
        badge: "Sales Manager",
        badgeColor: "#7c3aed",
        limit: "Max: 1,500 leads per Team Leader",
      },
      {
        n: 8,
        title: "Sales Team Leader Distributes Leads to Executives",
        summary:
          "Team Leaders receive their allocated leads and distribute them among their Sales Executives.",
        details: [
          "Log in as Sales Team Leader.",
          "Navigate to Sales Team Leader → Leads.",
          "Assign leads from your pool to individual Sales Executives on your team.",
          "Each Sales Executive can hold a maximum of 250 leads at a time.",
          "Monitor executive performance and reassign unworked leads as needed.",
        ],
        link: "/login",
        linkLabel: "Team Leader Login →",
        badge: "Sales Team Leader",
        badgeColor: "#059669",
        limit: "Max: 250 leads per Executive",
      },
      {
        n: 9,
        title: "Sales Executive Works the Leads",
        summary:
          "Sales Executives call, follow up, and move leads through the sales pipeline toward conversion.",
        details: [
          "Log in as Sales Executive.",
          "Go to Leads → All Leads to view your assigned leads.",
          "Update lead status: New → Contacted → Prospect → Won / Lost.",
          "Add follow-up notes, schedule callbacks, and log call outcomes.",
          "Convert hot leads to Prospects and initiate payment collection.",
          "Completed follow-ups generate automatic reminders for the next interaction.",
        ],
        link: "/login",
        linkLabel: "Executive Login →",
        badge: "Sales Executive",
        badgeColor: "#dc2626",
      },
    ],
  },
  {
    phase: "Finance & Payments",
    color: "#059669",
    bgColor: "#ecfdf5",
    steps: [
      {
        n: 10,
        title: "Finance Manager — Invoicing & Payments",
        summary:
          "The Finance team manages invoices, tracks payments, handles work orders, and oversees company expenses.",
        details: [
          "Log in as Finance Manager via Department Sign In.",
          "Navigate to Finance → Invoices to generate and send invoices to clients.",
          "Track payment status under Finance → Payments.",
          "Manage Work Orders linked to active projects.",
          "Record and categorise expenses under Finance → Expenses.",
          "Share payment links with prospects directly from the Payments module.",
        ],
        link: "/login",
        linkLabel: "Finance Login →",
        badge: "Finance",
        badgeColor: "#059669",
      },
    ],
  },
  {
    phase: "Project Management",
    color: "#7c3aed",
    bgColor: "#f3f0ff",
    steps: [
      {
        n: 11,
        title: "Management Team — Projects & Tasks",
        summary:
          "The Management department handles project lifecycle — from creation to delivery — with full Kanban and task tracking.",
        details: [
          "Management Manager logs in and creates Projects under Management → Projects.",
          "Projects are broken into tasks and assigned to Management Team Leaders.",
          "Team Leaders allocate tasks to Management Employees and track Kanban milestones.",
          "Employees update task status and log daily progress.",
          "Clients can be given read-only access to track project progress in real time via the Client Portal.",
        ],
        link: "/login",
        linkLabel: "Management Login →",
        badge: "Management",
        badgeColor: "#7c3aed",
      },
      {
        n: 12,
        title: "Client Portal — Magic Link Access",
        summary:
          "Clients do not need to create an account or log in. When a project is created, the Management Manager sends a secure magic link directly to the client's email.",
        details: [
          "Management Manager creates a Project and assigns the client's email address.",
          "The system automatically sends a secure, unique magic link to the client's inbox.",
          "The client clicks the link in their email — no login, no password required.",
          "The link opens the client's personalised project dashboard showing milestones, progress, and updates.",
          "Clients can view project status, download files, and track deliverables in real time.",
          "The magic link is tied to the specific project and expires based on the project timeline.",
          "To resend the link, the Management Manager can trigger a new email from the project settings.",
        ],
        link: "/login",
        linkLabel: "Management Login →",
        badge: "Management Manager",
        badgeColor: "#7c3aed",
      },
    ],
  },
  {
    phase: "HRM & Attendance",
    color: "#dc2626",
    bgColor: "#fff1f2",
    steps: [
      {
        n: 13,
        title: "Attendance — Check In & Check Out",
        summary:
          "All department employees (Sales, Finance, Management) use the built-in attendance tracker on every working day.",
        details: [
          "After logging in, click the attendance timer in the top navigation bar.",
          "Click Check In to start your session — your location is recorded.",
          "Use Pause if you take a break; Resume when you return.",
          "Click Check Out at the end of the day — you cannot check in again the same day.",
          "Admins and Managers can view full attendance history under HRM → Attendance.",
        ],
        link: "/login",
        linkLabel: "Department Login →",
        badge: "All Roles",
        badgeColor: "#0891b2",
      },
      {
        n: 14,
        title: "Leave Management",
        summary:
          "Employees can apply for leaves through the platform; managers approve or reject requests.",
        details: [
          "Navigate to HRM → Leaves from your dashboard.",
          "Click Apply Leave, select leave type, date range, and add a reason.",
          "Your manager receives a notification and can approve or reject the request.",
          "Leave balance is updated automatically upon approval.",
          "HR reports are available for Admins and Managers under Reports.",
        ],
        link: "/login",
        linkLabel: "Department Login →",
        badge: "All Roles",
        badgeColor: "#0891b2",
      },
    ],
  },
  {
    phase: "Support & Communication",
    color: "#64748b",
    bgColor: "#f8fafc",
    steps: [
      {
        n: 15,
        title: "Support Tickets",
        summary:
          "Any user can raise a support ticket for technical issues or internal requests.",
        details: [
          "Navigate to Support from your sidebar.",
          "Click Create Ticket, fill in the subject, priority, and description.",
          "The ticket is routed to the relevant team.",
          "Track ticket status: Open → In Progress → Resolved.",
          "Admins and Managers can reply and close tickets from their Support module.",
        ],
        link: "/login",
        linkLabel: "Login →",
        badge: "All Roles",
        badgeColor: "#0891b2",
      },
      {
        n: 16,
        title: "Announcements",
        summary:
          "Admins and Managers can broadcast announcements to their teams directly through the platform.",
        details: [
          "Navigate to Announcements from your dashboard sidebar.",
          "Click Create Announcement, enter the title and message body.",
          "Choose the target audience (all users, specific department, or specific team).",
          "Users receive an in-app notification and can view announcements in their Announcements module.",
        ],
        link: "/login",
        linkLabel: "Login →",
        badge: "Admin / Manager",
        badgeColor: "#2563eb",
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
      style={{ background: color + "18", color }}
    >
      {label}
    </span>
  );
}

function LimitBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {text}
    </span>
  );
}

function StepCard({ step, phaseColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        {/* Step number circle */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm"
          style={{ background: phaseColor }}
        >
          {step.n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[#2a465a]">{step.title}</h3>
            <Badge label={step.badge} color={step.badgeColor} />
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{step.summary}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-3">
        {/* Detail steps */}
        <ul className="space-y-2">
          {step.details.map((d, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: phaseColor + "cc" }}
              >
                {i + 1}
              </span>
              {d}
            </li>
          ))}
        </ul>

        {/* Limit badge */}
        {step.limit && (
          <div className="pt-1">
            <LimitBadge text={step.limit} />
          </div>
        )}

        {/* CTA link */}
        <div className="pt-2">
          <Link
            to={step.link}
            className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors duration-200 hover:underline"
            style={{ color: phaseColor }}
          >
            {step.linkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PhaseSection({ phase }) {
  return (
    <div className="space-y-4">
      {/* Phase header */}
      <div className="flex items-center gap-3">
        <div
          className="h-1 w-8 rounded-full"
          style={{ background: phase.color }}
        />
        <span
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: phase.color }}
        >
          {phase.phase}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Step cards */}
      <div className="space-y-4">
        {phase.steps.map((step) => (
          <StepCard key={step.n} step={step} phaseColor={phase.color} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HowToUse() {
  return (
    <PolicyLayout
      title="How to Use Graphura CRM"
      subtitle="A complete step-by-step guide to onboarding, managing leads, running projects, and operating your CRM from day one."
    >
      {/* Intro card */}
      <div className="bg-gradient-to-br from-[#2a465a] to-[#1a3347] rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-extrabold mb-1">Getting Started</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Follow the steps below in order to set up and run your entire CRM
              operation — from registering your company to closing deals, managing
              projects, and tracking attendance. Each step links directly to the
              relevant page.
            </p>
          </div>
          <div className="flex-shrink-0 grid grid-cols-2 gap-2 text-center">
            {[
              ["16", "Steps"],
              ["6", "Phases"],
              ["9", "Roles"],
              ["6000", "Max Leads"],
            ].map(([val, lbl]) => (
              <div key={lbl} className="bg-white/10 rounded-xl px-3 py-2">
                <p className="text-lg font-black">{val}</p>
                <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-step phases */}
      {STEPS.map((phase) => (
        <PhaseSection key={phase.phase} phase={phase} />
      ))}

      {/* Lead limits quick reference */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-lg">📊</span>
          <h2 className="text-base font-bold text-[#2a465a]">Lead Distribution Limits — Quick Reference</h2>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="text-left px-4 py-3 rounded-tl-lg font-bold">Role</th>
                <th className="text-left px-4 py-3 font-bold">Action</th>
                <th className="text-left px-4 py-3 rounded-tr-lg font-bold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["Admin", "Uploads leads to company pool", "6,000 leads (company total)"],
                ["Sales Manager", "Distributes from pool to Team Leaders", "1,500 leads per Team Leader"],
                ["Sales Team Leader", "Distributes to Sales Executives", "250 leads per Executive"],
                ["Sales Executive", "Works assigned leads", "250 leads max"],
              ].map(([role, action, limit]) => (
                <tr key={role} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#2a465a]">{role}</td>
                  <td className="px-4 py-3 text-slate-600">{action}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      {limit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-lg">📬</span>
          <h2 className="text-base font-bold text-[#2a465a]">Need Help?</h2>
        </div>
        <div className="px-6 py-5 space-y-2 text-sm text-slate-600">
          <p>If you run into any issues or need assistance with onboarding, our support team is available:</p>
          <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <p>
              <span className="font-semibold text-slate-700">Email:</span>{" "}
              <a href="mailto:official@graphura.in" className="text-[#2a465a] hover:underline font-medium">
                official@graphura.in
              </a>
            </p>
            <p><span className="font-semibold text-slate-700">Phone:</span> +91 73780 21327</p>
            <p><span className="font-semibold text-slate-700">Address:</span> Graphura India Private Limited, near RSF, Pataudi, Gurgaon, Haryana 122503</p>
          </div>
        </div>
      </div>
    </PolicyLayout>
  );
}

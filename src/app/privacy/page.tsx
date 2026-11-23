import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | StokvelOS",
  description:
    "How StokvelOS collects, uses, shares and protects personal information in terms of South Africa's POPIA.",
};

const CONTACT_EMAIL = "stokvelos.support@gmail.com";
const LAST_UPDATED = "23 November 2026";

type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
};

const sections: PolicySection[] = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    paragraphs: [
      `StokvelOS is the responsible party (data controller) for the personal information described in this policy. We provide a shared, tamper-evident ledger and payout scheduler for stokvels.`,
      `StokvelOS is a record-keeping tool only. We do not hold, move, invest or safeguard any money, and we are not a bank or a financial institution. This policy explains how we process personal information in terms of the Protection of Personal Information Act 4 of 2013 (POPIA).`,
    ],
  },
  {
    id: "information-we-collect",
    title: "2. Personal information we collect",
    paragraphs: [
      `We collect only the information needed to run a stokvel ledger. We collect it when you create an account, create or join a stokvel, record a contribution, schedule a payout, or raise a dispute.`,
    ],
    items: [
      `Name and phone number.`,
      `Email address.`,
      `Stokvel membership and your role in each group.`,
      `Contribution records: amount, period and who recorded them.`,
      `Payout schedule, rotation order and payment status.`,
      `Disputes you raise and how they were resolved.`,
      `Audit-log entries of actions taken in a stokvel.`,
    ],
  },
  {
    id: "why-we-process",
    title: "3. Why we process it",
    paragraphs: [
      `We process your personal information to create and secure your account, show you your stokvels, balances and payout dates, maintain one shared ledger that all members can see, send the in-app reminders and notifications described in the app, keep an immutable audit trail so disputes can be resolved, and respond to your support requests.`,
      `We rely on your consent (given when you register and accept this policy) and on the need to perform our services to you. We do not use your information for advertising, profiling or automated decision-making.`,
    ],
  },
  {
    id: "who-we-share-with",
    title: "4. Who we share it with",
    paragraphs: [
      `Other members of your stokvel can see your name, membership, contributions and payouts for that group, because a shared ledger is the point of the app. Your phone number and email address are not shown to other members.`,
      `We use these service providers (processors), who act only on our instructions:`,
    ],
    items: [
      `Supabase — database, authentication and Row Level Security.`,
      `Vercel — application hosting and delivery.`,
    ],
  },
  {
    id: "hosting",
    title: "5. Where your information is hosted",
    paragraphs: [
      `Our database and authentication are hosted by Supabase. We configure the project in Supabase's Africa (South Africa) region where available; if that region is not available when the project is created, we will use the closest supported region and update this page before launch. The application is hosted on Vercel.`,
      `Where a provider processes personal information outside South Africa, we put appropriate safeguards in place as required by POPIA.`,
    ],
  },
  {
    id: "retention",
    title: "6. How long we keep it",
    paragraphs: [
      `We keep your account and stokvel records while your account is active. Group records — contributions, payouts and disputes — are kept for the life of the stokvel so members retain a complete history.`,
      `If you delete your account, we remove your profile and anonymise your audit-log entries so the ledger stays tamper-evident. Those anonymised entries are retained indefinitely and no longer identify you.`,
    ],
  },
  {
    id: "security",
    title: "7. Security",
    paragraphs: [
      `Supabase Row Level Security is enforced on every table, so members only see data for stokvels they belong to and only organisers can change group records. Passwords are hashed by Supabase Auth and are never stored in plain text. We follow data minimisation: we collect only what the ledger needs. The audit log is immutable — entries cannot be edited or deleted.`,
      `No system is perfectly secure, but these controls are designed to keep your records accurate and your personal information protected.`,
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies and tracking",
    paragraphs: [
      `In v1 StokvelOS uses no analytics or advertising cookies and requests no device permissions. The only cookie is the session cookie set by Supabase Auth to keep you signed in; a session lasts up to 30 days. You can end it at any time with Log out in Profile/Settings.`,
    ],
  },
  {
    id: "your-rights",
    title: "9. Your rights",
    paragraphs: [
      `In terms of POPIA you may ask us to:`,
    ],
    items: [
      `Access the personal information we hold about you.`,
      `Correct information that is inaccurate or incomplete.`,
      `Delete your information, using Delete account in Profile/Settings.`,
      `Object to processing in certain circumstances where POPIA allows it.`,
    ],
  },
  {
    id: "children",
    title: "10. Children",
    paragraphs: [
      `StokvelOS is for people aged 18 or older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has an account, contact us using the address below.`,
    ],
  },
  {
    id: "changes",
    title: "11. Changes to this policy",
    paragraphs: [
      `We will update this page when our practices change. The "Last updated" date at the top always reflects the current version, and material changes will be communicated in the app.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#1b5e20] underline-offset-4 hover:underline dark:text-[#2e7d32]"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to StokvelOS
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Last updated: <time dateTime="2026-11-23">{LAST_UPDATED}</time>
      </p>

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} className="text-lg font-semibold sm:text-xl">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="mt-3 leading-7 text-neutral-800 dark:text-neutral-200"
              >
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-neutral-800 dark:text-neutral-200">
                {section.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section
          aria-labelledby="contact"
          className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
        >
          <h2 id="contact" className="text-lg font-semibold sm:text-xl">
            12. Contact us
          </h2>
          <p className="mt-3 leading-7 text-neutral-800 dark:text-neutral-200">
            For any privacy question, data-subject request or complaint, email us
            at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#1b5e20] underline underline-offset-2 dark:text-[#2e7d32]"
            >
              {CONTACT_EMAIL}
            </a>
            . You may also lodge a complaint with the Information Regulator of
            South Africa. We may need to verify your identity before acting on a
            request.
          </p>
        </section>
      </div>
    </main>
  );
}

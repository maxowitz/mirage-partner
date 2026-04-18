/* =========================================================================
   MIRAGE STUDIOS — PROPOSAL DECK TEMPLATE
   All copy lives here. Edit any string and the site updates on reload.
   Sections are rendered in the order defined here.
   ========================================================================= */

window.CONTENT = {

  meta: {
    browserTitle: "Proposal — Mirage Studios",
    pageDescription: "A proposal prepared by Mirage Studios.",
    partnershipLabel: "Client × Mirage Studios"
  },

  theme: {
    colors: {
      bg:        "#030201",
      bgCard:    "rgba(255,255,255,0.035)",
      gold:      "#B98C37",
      goldLight: "rgba(185,140,55,0.75)",
      text:      "rgba(240,230,210,0.90)",
      textMuted: "rgba(240,230,210,0.40)",
      border:    "rgba(255,255,255,0.08)",
      rule:      "rgba(185,140,55,0.25)",
    },
    fonts: {
      display: '"Cormorant Garamond", "Georgia", serif',
      body:    '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif',
      mono:    '"JetBrains Mono", monospace',
    }
  },

  hero: {
    eyebrow:  "Prepared by Mirage Studios",
    headline: "We build exactly\nwhat you imagine.",
    subhead:  "A proposal for [Client Name].",
    date:     new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  },

  sections: [
    {
      id:      "overview",
      title:   "Overview",
      eyebrow: "The Brief",
      body:    "We've reviewed your goals and identified a clear path forward. This proposal outlines our approach, timeline, and investment.",
    },
    {
      id:      "approach",
      title:   "Our Approach",
      eyebrow: "Methodology",
      body:    "Every project at Mirage Studios begins with deep listening. We map your vision, identify constraints early, and build iteratively so you see real progress fast.",
      bullets: [
        "Discovery & architecture sprint",
        "Design-first development",
        "Iterative delivery with regular reviews",
        "Launch + post-launch support",
      ]
    },
    {
      id:      "investment",
      title:   "Investment",
      eyebrow: "Pricing",
      items:   [
        { label: "Design & UX",         amount: "—" },
        { label: "Development",         amount: "—" },
        { label: "Launch & handoff",    amount: "—" },
      ],
      total:   "—",
      note:    "Exact pricing provided after discovery call.",
    },
    {
      id:      "timeline",
      title:   "Timeline",
      eyebrow: "Milestones",
      phases:  [
        { week: "Week 1–2",  label: "Discovery",      desc: "Kickoff, architecture, design direction" },
        { week: "Week 3–6",  label: "Build",           desc: "Core development, weekly check-ins" },
        { week: "Week 7–8",  label: "Polish & Test",   desc: "QA, refinements, staging review" },
        { week: "Week 9",    label: "Launch",           desc: "Go-live, handoff, documentation" },
      ]
    },
  ],

  cta: {
    headline: "Ready to build?",
    body:     "Let's schedule a discovery call to confirm scope and get started.",
    email:    "hello@miragestudios.io",
    buttonLabel: "Get in Touch →",
  },

  footer: {
    brand:   "Mirage Studios",
    tagline: "We build exactly what you imagine.",
    email:   "hello@miragestudios.io",
  }
}

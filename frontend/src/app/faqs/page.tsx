const faqs = [
  {
    question: "What is FluxPay?",
    answer: "FluxPay is a multichain escrow and collaboration platform that securely connects creators and brands. It uses smart contracts and AI to ensure that creators get paid instantly upon completing deliverables, while protecting brands from non-delivery."
  },
  {
    question: "How does the smart escrow work?",
    answer: "When a brand hires a creator, the agreed budget is locked in a secure on-chain USDC escrow smart contract. The funds are only released to the creator once the specific milestones are submitted and approved, either manually by the brand or autonomously by our AI."
  },
  {
    question: "What is AI milestone verification?",
    answer: "Our platform uses Venice AI to evaluate a creator's submitted deliverables against the original job requirements. If the AI determines the work meets the brief, it can autonomously trigger the release of funds from escrow without requiring the brand's manual intervention."
  },
  {
    question: "What cryptocurrencies do you support?",
    answer: "Currently, FluxPay primarily supports USDC for escrow and payments to ensure price stability for both brands and creators. We utilize cross-chain technology to support multiple networks."
  },
  {
    question: "Is there a fee to use FluxPay?",
    answer: "Signing up and browsing deals is completely free. We charge a small platform fee only when a deal is successfully completed and funds are released from escrow."
  },
  {
    question: "What happens if there's a dispute?",
    answer: "If a brand disputes a deliverable or there's a disagreement, the funds remain safely in escrow. The dispute is then escalated to our moderation team or a decentralized arbitration panel to resolve the issue fairly based on the initial job brief."
  }
];

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Grappa ExtraBold', sans-serif" }}>
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-foreground/70">
              Everything you need to know about the platform and how it works.
            </p>
          </div>

          <div className="w-full space-y-4 mt-10">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-secondary/10 border border-border/50 rounded-xl overflow-hidden cursor-pointer transition-colors hover:bg-secondary/20">
                <summary className="flex items-center justify-between p-6 text-lg font-medium outline-none">
                  {faq.question}
                  <span className="transition-transform group-open:rotate-180 text-foreground/50">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-foreground/70 text-base leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#a3e635] font-bold tracking-widest uppercase text-sm mb-4">The Process</p>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Works</span></h1>
        
        <div className="prose prose-invert max-w-none prose-lg">
          <p className="text-xl text-slate-300 leading-relaxed mb-12">
            We combined smart contracts with AI to create a completely trustless environment for influencer marketing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#111111] border border-[#1f1f1f] p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-white">Step 1: The Deal</h3>
              <p className="text-sm text-slate-400">A brand posts a deal with specific deliverables, budgets, and milestones. Creators apply to the deal.</p>
            </div>
            <div className="bg-[#111111] border border-[#1f1f1f] p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-white">Step 2: The Escrow</h3>
              <p className="text-sm text-slate-400">The brand selects a creator, and the total budget is deposited into our secure smart contract escrow.</p>
            </div>
            <div className="bg-[#111111] border border-[#1f1f1f] p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-white">Step 3: Verification</h3>
              <p className="text-sm text-slate-400">The creator submits their work. Our AI analyzes the content to ensure it meets the brand's requirements.</p>
            </div>
            <div className="bg-[#111111] border border-[#1f1f1f] p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-white">Step 4: Payout</h3>
              <p className="text-sm text-slate-400">Once verified, the smart contract automatically releases the USDC to the creator. No delays, no manual invoicing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

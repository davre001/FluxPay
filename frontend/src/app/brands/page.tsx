export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#a3e635] font-bold tracking-widest uppercase text-sm mb-4">Scale Your Marketing</p>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">For <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Brands</span></h1>
        
        <div className="prose prose-invert max-w-none prose-lg">
          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            Finding and managing top-tier creators is hard. Trusting them to deliver on time is harder. FluxPay gives you the security to scale your influencer marketing effortlessly.
          </p>

          <div className="space-y-6 mt-12">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">1</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Hire Top Talent</h3>
                <p className="text-slate-400">Discover thousands of verified creators across various niches. Review their on-chain reputation and previous completed deals before hiring.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">2</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">AI Milestone Verification</h3>
                <p className="text-slate-400">You don't have to manually review every piece of content. Our AI automatically verifies the deliverables against the original brief, saving you hours of management time.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">3</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Risk-Free Capital</h3>
                <p className="text-slate-400">Your funds are held securely in a smart contract. If the creator fails to deliver according to the requirements, your USDC is returned to you automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

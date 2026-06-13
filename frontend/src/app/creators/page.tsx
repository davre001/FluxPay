export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#a3e635] font-bold tracking-widest uppercase text-sm mb-4">Empowering Talent</p>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">For <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Creators</span></h1>
        
        <div className="prose prose-invert max-w-none prose-lg">
          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            Stop chasing unpaid invoices. With FluxPay, the money is locked in escrow before you even start working. When you deliver, you get paid. Instantly.
          </p>

          <div className="space-y-6 mt-12">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">1</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Find Deals</h3>
                <p className="text-slate-400">Browse through hundreds of brand deals posted exclusively on our platform. Filter by your specific niches and preferred platforms.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">2</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Guaranteed Payment</h3>
                <p className="text-slate-400">Once you accept a deal, the brand's funds are locked into an immutable smart contract. We guarantee that if you hit the milestones, the funds release automatically.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#a3e635] font-bold shrink-0 mt-1">3</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Build Your Reputation</h3>
                <p className="text-slate-400">Every successful deal increases your on-chain reputation score, helping you secure even bigger and better deals in the future.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

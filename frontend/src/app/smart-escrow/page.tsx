export default function SmartEscrowPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#a3e635] font-bold tracking-widest uppercase text-sm mb-4">Secured On-Chain</p>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Escrow</span></h1>
        
        <div className="prose prose-invert max-w-none prose-lg">
          <p className="text-xl text-slate-300 leading-relaxed mb-12">
            The backbone of FluxPay is our immutable smart contract escrow system. It guarantees that funds are secure, and payouts are automatic and completely trustless.
          </p>

          <div className="space-y-8 mt-12">
            <div className="bg-[#111111] border border-[#1f1f1f] p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">100% Immutable</h3>
              <p className="text-slate-400">Once a deal is signed and funds are locked, the smart contract cannot be altered. The rules for payout are hardcoded into the blockchain, ensuring complete fairness.</p>
            </div>
            
            <div className="bg-[#111111] border border-[#1f1f1f] p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Instant USDC Payouts</h3>
              <p className="text-slate-400">Our escrows are denominated in USDC, a stablecoin pegged to the US Dollar. As soon as the AI verifies the milestones, the funds are instantly transferred to the creator's wallet. No banking delays.</p>
            </div>

            <div className="bg-[#111111] border border-[#1f1f1f] p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Milestone Granularity</h3>
              <p className="text-slate-400">Smart escrows support complex, multi-stage deals. Funds can be released progressively as different parts of a project are completed, providing security for both parties at every step.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

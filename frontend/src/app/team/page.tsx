export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#a3e635] font-bold tracking-widest uppercase text-sm mb-4">The People Behind the Platform</p>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Team</span></h1>
        
        <div className="prose prose-invert max-w-none prose-lg">
          <p className="text-xl text-slate-300 leading-relaxed mb-12">
            FluxPay is built by a global team of blockchain engineers, creator economy experts, and designers who believe in a fairer, more transparent way for creators and brands to collaborate.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-[#111111] border border-[#1f1f1f] p-8 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 flex items-center justify-center text-2xl font-black">E</div>
              <h3 className="text-2xl font-bold mb-2">Engineering</h3>
              <p className="text-slate-400">Our engineering team brings years of experience in smart contract development and scalable backend architecture to ensure your escrows are perfectly secure.</p>
            </div>
            
            <div className="bg-[#111111] border border-[#1f1f1f] p-8 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#a3e635] to-[#4ade80] text-black mb-6 flex items-center justify-center text-2xl font-black">P</div>
              <h3 className="text-2xl font-bold mb-2">Product</h3>
              <p className="text-slate-400">Our product and design team is obsessed with making the on-chain experience completely invisible, creating a seamless interface for all users.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

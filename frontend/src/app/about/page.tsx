import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ fontFamily: "'Grappa ExtraBold', sans-serif" }}>
              About FluxPay
            </h1>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              We are revolutionizing how brands and creators collaborate by building a trustless, transparent, and instant payment infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-secondary/30 p-8 rounded-2xl border border-border/50 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Secured On-Chain</h3>
              <p className="text-foreground/70">
                Escrow smart contracts guarantee that funds are locked securely until deliverables are approved.
              </p>
            </div>
            
            <div className="bg-secondary/30 p-8 rounded-2xl border border-border/50 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Verified by AI</h3>
              <p className="text-foreground/70">
                Our cutting-edge Venice AI autonomously evaluates milestones, ensuring unbiased and lightning-fast approvals.
              </p>
            </div>

            <div className="bg-secondary/30 p-8 rounded-2xl border border-border/50 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Trusted Globally</h3>
              <p className="text-foreground/70">
                Operating without borders. We empower creators globally to connect with top-tier brands seamlessly.
              </p>
            </div>
          </div>

          <div className="bg-primary/5 p-8 md:p-12 rounded-3xl border border-primary/20 text-center space-y-6 mt-16">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Join thousands of creators and organizations leveraging FluxPay for secure, transparent partnerships.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/explore">
                <button className="bg-white text-black font-bold text-sm px-8 py-3 rounded-full hover:bg-gray-200 transition-all flex items-center gap-2">
                  Explore Deals <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

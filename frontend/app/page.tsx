import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Receipt, PieChart, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">Track Your Expenses Effortlessly with AI</h1>
              <p className="text-lg md:text-xl opacity-90">
                Upload your receipts and let our AI assistant extract all the details. Gain insights into your spending
                habits and take control of your finances.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative w-full h-64 md:h-80 bg-white/10 rounded-lg backdrop-blur-sm p-6 shadow-xl">
                <div className="absolute top-4 left-4 right-4 h-8 bg-white/20 rounded-md"></div>
                <div className="absolute top-16 left-4 right-4 h-40 bg-white/20 rounded-md"></div>
                <div className="absolute bottom-4 left-4 right-4 h-12 bg-white/20 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Receipt className="h-10 w-10 text-emerald-500" />}
              title="Upload Receipts"
              description="Simply take a photo or upload your receipt images. Our AI will do the rest."
            />
            <FeatureCard
              icon={<PieChart className="h-10 w-10 text-emerald-500" />}
              title="Track Expenses"
              description="View detailed breakdowns of your spending by category, vendor, and time period."
            />
            {/* <FeatureCard
              icon={<PieChart className="h-10 w-10 text-emerald-500" />}
              title="Query Your Receipts"
              description="Ask questions about your receipts and get answers in plain text."
            /> */}
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-emerald-500" />}
              title="Secure Storage"
              description="All your financial data is encrypted and securely stored for your peace of mind."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to simplify your expense tracking?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed their financial management with our AI assistant.
          </p>
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600">
            <Link href="/signup" className="flex items-center gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">TrackIt-AI</h3>
              <p className="text-gray-400">Your personal finance assistant</p>
            </div>
            <div className="flex gap-6">
              <Link href="/login" className="text-gray-400 hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="text-gray-400 hover:text-white">
                Sign Up
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                Terms
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-gray-500">
            &copy; {new Date().getFullYear()} TrackIt-AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

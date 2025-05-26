import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowRight,
    Receipt,
    Shield,
    Zap,
    MessageSquare,
    TrendingUp,
    Star,
    Upload,
    Brain,
    BarChart3,
} from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-8 w-8 text-emerald-600" />
                            <span className="text-2xl font-bold text-gray-900">TrackIT</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                <div className="container mx-auto px-4 py-20 md:py-28">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                        <div className="lg:w-1/2 space-y-8">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                <Zap className="h-3 w-3 mr-1" />
                                AI-Powered Expense Tracking
                            </Badge>
                            <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                Smart Receipt Tracking with AI
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Upload receipts, extract data instantly, and get intelligent insights about your spending. Ask questions
                                about your expenses in plain English and get instant answers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">
                                    <Link href="/signup" className="flex items-center gap-2">
                                        Start  <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                                    <Link href="#demo">Watch Demo</Link>
                                </Button>
                            </div>

                        </div>
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                            <Upload className="h-5 w-5 text-emerald-600" />
                                            <span className="text-sm font-medium">Receipt uploaded successfully</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Amount</div>
                                                <div className="font-semibold">$47.82</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Vendor</div>
                                                <div className="font-semibold">Whole Foods</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Category</div>
                                                <div className="font-semibold">Groceries</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Date</div>
                                                <div className="font-semibold">Dec 15, 2024</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div className="text-sm">
                                                    <div className="font-medium text-blue-900 mb-1">
                                                        Ask AI: "How much did I spend on groceries this month?"
                                                    </div>
                                                    <div className="text-blue-700">
                                                        You've spent $342.18 on groceries this month across 8 transactions.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-3 rounded-full shadow-lg">
                                    <Brain className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How TrackIT Works</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Three simple steps to transform your expense tracking experience
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Receipt className="h-12 w-12 text-emerald-500" />}
                            title="Upload Receipts"
                            description="Simply take a photo or upload your receipt images. Our AI instantly extracts all relevant data including amount, vendor, date, and items."
                            step="1"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-12 w-12 text-emerald-500" />}
                            title="Track & Analyze"
                            description="View detailed breakdowns of your spending by category, vendor, and time period. Get insights into your spending patterns."
                            step="2"
                        />
                        <FeatureCard
                            icon={<MessageSquare className="h-12 w-12 text-emerald-500" />}
                            title="Ask Questions"
                            description="Chat with your receipts! Ask questions like 'How much did I spend on restaurants last month?' and get instant answers."
                            step="3"
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            {/* <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose TrackIT?</h2>
              <div className="space-y-6">
                <BenefitItem
                  icon={<Zap className="h-6 w-6 text-emerald-500" />}
                  title="Lightning Fast Processing"
                  description="AI extracts receipt data in seconds, not minutes"
                />
                <BenefitItem
                  icon={<Brain className="h-6 w-6 text-emerald-500" />}
                  title="Intelligent Categorization"
                  description="Automatically categorizes expenses with 95% accuracy"
                />
                <BenefitItem
                  icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
                  title="Smart Insights"
                  description="Get personalized spending insights and recommendations"
                />
                <BenefitItem
                  icon={<Shield className="h-6 w-6 text-emerald-500" />}
                  title="Bank-Level Security"
                  description="Your financial data is encrypted and securely stored"
                />
              </div>
            </div>
            <div className="relative">
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Monthly Spending Overview</h3>
                      <Badge variant="secondary">December 2024</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Groceries</span>
                        <span className="font-medium">$342.18</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Restaurants</span>
                        <span className="font-medium">$189.45</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "38%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Transportation</span>
                        <span className="font-medium">$95.20</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "19%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section> */}

            {/* Testimonials */}
            {/* <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied users</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sarah Johnson"
              role="Small Business Owner"
              content="TrackIT has revolutionized how I manage my business expenses. The AI is incredibly accurate and saves me hours every week."
              rating={5}
            />
            <TestimonialCard
              name="Mike Chen"
              role="Freelancer"
              content="Being able to ask questions about my spending in plain English is a game-changer. It's like having a personal finance assistant."
              rating={5}
            />
            <TestimonialCard
              name="Emily Davis"
              role="Marketing Manager"
              content="The automatic categorization is spot-on. I no longer dread expense reporting - TrackIT makes it effortless."
              rating={5}
            />
          </div>
        </div>
      </section> */}

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Expense Tracking?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join thousands of users who have simplified their financial management with AI-powered receipt tracking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6">
                            <Link href="/signup" className="flex items-center gap-2">
                                Start Free Trial <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Button> */}
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-6"
                        >
                            <Link href="#demo">Watch Demo</Link>
                        </Button>
                    </div>
                    {/* <p className="text-sm mt-6 opacity-75">No credit card required • 14-day free trial • Cancel anytime</p> */}
                </div>
            </section>

            {/* Footer */}
            {/* <footer className="py-12 bg-gray-900 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Receipt className="h-8 w-8 text-emerald-500" />
                                <span className="text-2xl font-bold">TrackIT</span>
                            </div>
                            <p className="text-gray-400 mb-4 max-w-md">
                                Your intelligent expense tracking companion. Upload receipts, get insights, and take control of your
                                finances with AI.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span className="text-sm text-gray-400 ml-2">4.9/5 rating</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <div className="space-y-2">
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Features
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Pricing
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    API
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Integrations
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <div className="space-y-2">
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Help Center
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Contact Us
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Privacy Policy
                                </Link>
                                <Link href="#" className="block text-gray-400 hover:text-white">
                                    Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                        <p>&copy; {new Date().getFullYear()} TrackIT. All rights reserved.</p>
                    </div>
                </div>
            </footer> */}
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    step,
}: {
    icon: React.ReactNode
    title: string
    description: string
    step: string
}) {
    return (
        <Card className="relative p-8 text-center hover:shadow-lg transition-shadow">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {step}
            </div>
            <CardContent className="p-0">
                <div className="mb-6 flex justify-center">{icon}</div>
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    )
}

function BenefitItem({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-emerald-100 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-gray-600">{description}</p>
            </div>
        </div>
    )
}

function TestimonialCard({
    name,
    role,
    content,
    rating,
}: {
    name: string
    role: string
    content: string
    rating: number
}) {
    return (
        <Card className="p-6">
            <CardContent className="p-0">
                <div className="flex items-center gap-1 mb-4">
                    {[...Array(rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{content}"</p>
                <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-gray-500">{role}</div>
                </div>
            </CardContent>
        </Card>
    )
}

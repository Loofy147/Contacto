// app/page.tsx
/**
 * Home page - public landing page
 * RED TEAM: Test public access, SEO injection, performance
 */

import Link from 'next/link';
import { ArrowRight, BarChart3, Users, Package, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Contacto
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/directory"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Directory
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              The All-in-One Digital Ecosystem for Algerian Businesses
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Professional directory, API-first POS system, and complete financial services layer -
              all in one platform designed for Algeria.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-3">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/directory" className="btn btn-outline text-lg px-8 py-3">
                Explore Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-xl text-gray-600">
              Powerful tools built specifically for the Algerian market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-primary-100 text-xl mb-8">
            Join thousands of Algerian businesses already using Contacto
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Contacto</h3>
              <p className="text-sm">
                Empowering Algerian businesses with digital tools for growth.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/directory" className="hover:text-white">Directory</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Contacto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Users,
    title: 'Professional Directory',
    description: 'Connect with verified businesses and professionals across Algeria.',
  },
  {
    icon: BarChart3,
    title: 'Point of Sale',
    description: 'Modern, API-first POS system with real-time analytics and reporting.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, manage products, and automate reordering.',
  },
  {
    icon: Shield,
    title: 'Financial Services',
    description: 'Integrated payments, invoicing, and financial management tools.',
  },
];
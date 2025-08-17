import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    const fadeEls = document.querySelectorAll('.fade-in')
    fadeEls.forEach((el) => observer.observe(el))

    const onAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
    const anchors = document.querySelectorAll('a[href^="#"]')
    anchors.forEach((a) => a.addEventListener('click', onAnchorClick))

    return () => {
      fadeEls.forEach((el) => observer.unobserve(el))
      anchors.forEach((a) => a.removeEventListener('click', onAnchorClick))
      observer.disconnect()
    }
  }, [])

  return (
    <div className="bg-white text-gray-900 scroll-smooth">
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-navy">NestBase</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-navy transition-colors cursor-pointer">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-navy transition-colors cursor-pointer">Pricing</a>
              <a href="#demo" className="text-gray-600 hover:text-navy transition-colors cursor-pointer">Demo</a>
              <a href="/login" className="text-gray-600 hover:text-navy transition-colors cursor-pointer">Login</a>
              <button className="bg-electric text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Start Free Beta
              </button>
            </div>
            <div className="md:hidden">
              <i className="fas fa-bars text-navy text-xl" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-20 bg-gradient-to-br from-navy to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Branded Client Portal — <span className="text-electric">In Minutes.</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Deliver projects, share updates, and embed the tools you already use — all under your brand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-electric text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
                  Start Free Beta
                </button>
                <a href="#demo" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-navy transition-colors text-center">
                  See How It Works
                </a>
              </div>
            </div>
            <div className="fade-in">
              <img
                className="w-full rounded-xl shadow-2xl"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/99be3f3342-c7908f67a9e91ec7965d.png"
                alt="modern macbook mockup showing branded client portal dashboard with white interface and blue accents"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-5xl font-bold text-navy mb-6">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create professional client portals with all the tools your clients need, seamlessly integrated under your brand.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-globe text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">Custom Subdomains &amp; Domains</h3>
              <p className="text-gray-600">Brand your dashboard instantly with your own domain or subdomain.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-puzzle-piece text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">Embed Your Tools</h3>
              <p className="text-gray-600">Notion, Monday.com, Google Docs, Calendly, and more in one place.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-shield-alt text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">Secure Client Login</h3>
              <p className="text-gray-600">Per-tenant authentication keeps client data safe and separated.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-link text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">Integrations</h3>
              <p className="text-gray-600">Connect with Slack, Zapier, Calendly webhooks, and more.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-file-alt text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">File &amp; Form Sharing</h3>
              <p className="text-gray-600">Upload documents or collect client responses seamlessly.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow fade-in">
              <div className="w-12 h-12 bg-electric/10 rounded-lg flex items-center justify-center mb-6">
                <i className="fas fa-paint-brush text-electric text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">White-Label Ready</h3>
              <p className="text-gray-600">Remove Offr.app branding completely for a fully custom experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="demo" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-5xl font-bold text-navy mb-6">How It Works</h2>
            <p className="text-xl text-gray-600">Get your branded client portal up and running in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center fade-in">
              <div className="w-16 h-16 bg-electric text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-2xl font-semibold text-navy mb-4">Sign Up</h3>
              <p className="text-gray-600">Choose your portal name and get started in seconds.</p>
            </div>
            <div className="text-center fade-in">
              <div className="w-16 h-16 bg-electric text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-2xl font-semibold text-navy mb-4">Customize</h3>
              <p className="text-gray-600">Add your logo, colors, and embed your favorite tools.</p>
            </div>
            <div className="text-center fade-in">
              <div className="w-16 h-16 bg-electric text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-2xl font-semibold text-navy mb-4">Invite Clients</h3>
              <p className="text-gray-600">They log in and see your branded content immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-5xl font-bold text-navy mb-6">Simple Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your business needs.</p>
            <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
              <button className="px-6 py-2 text-sm font-medium text-white bg-electric rounded-md">Monthly</button>
              <button className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-navy">
                Yearly <span className="text-teal text-xs ml-1">2 months free</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 fade-in">
              <h3 className="text-2xl font-bold text-navy mb-2">Starter</h3>
              <div className="text-5xl font-bold text-navy mb-6">
                $39<span className="text-lg text-gray-600 font-normal">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Up to 30 clients (tenant members)</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Embedded screens from Notion, Monday, Google, Calendly &amp; more</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">File management</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Forms management</span></li>
              </ul>
              <button className="w-full bg-gray-100 text-navy py-4 rounded-xl font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">
                Get Started
              </button>
            </div>
            <div className="bg-gradient-to-br from-electric to-blue-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 fade-in relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-teal text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="text-5xl font-bold text-white mb-2">
                $99<span className="text-lg text-blue-100 font-normal">/month</span>
              </div>
              <p className="text-blue-100 text-sm mb-6">Additional admin team member $39/month (up to 3)</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start"><i className="fas fa-check text-white mr-3 mt-1" /><span className="text-blue-50">Up to 500 clients</span></li>
                <li className="flex items-start"><i className="fas fa-check text-white mr-3 mt-1" /><span className="text-blue-50">Everything in Starter</span></li>
                <li className="flex items-start"><i className="fas fa-check text-white mr-3 mt-1" /><span className="text-blue-50">Integrations</span></li>
                <li className="flex items-start"><i className="fas fa-check text-white mr-3 mt-1" /><span className="text-blue-50">API / Zapier / Make</span></li>
              </ul>
              <button className="w-full bg-white text-electric py-4 rounded-xl font-bold hover:bg-gray-50 hover:scale-105 transition-all duration-200 shadow-lg">
                Get Started
              </button>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 fade-in">
              <h3 className="text-2xl font-bold text-navy mb-2">Advanced</h3>
              <div className="text-5xl font-bold text-navy mb-2">
                $199<span className="text-lg text-gray-600 font-normal">/month</span>
              </div>
              <p className="text-gray-600 text-sm mb-6">3 team slots included, $29/month per extra admin</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Everything in Starter &amp; Pro</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Stripe billing &amp; invoicing</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">3 team slots (scalable with add-ons)</span></li>
                <li className="flex items-start"><i className="fas fa-check text-teal mr-3 mt-1" /><span className="text-gray-700">Priority support</span></li>
              </ul>
              <button className="w-full bg-navy text-white py-4 rounded-xl font-semibold hover:bg-blue-900 hover:scale-105 transition-all duration-200">
                Contact Sales
              </button>
            </div>
          </div>
          <div className="text-center mt-12 fade-in">
            <button className="text-electric hover:text-blue-600 font-medium underline">Compare all features →</button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-5xl font-bold text-navy mb-6">Loved by Agencies, Coaches, and Service Providers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm fade-in">
              <p className="text-gray-600 mb-6">"Offr.app transformed how we deliver projects to clients. Everything is organized and branded beautifully."</p>
              <div className="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Sarah" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-navy">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">Creative Director</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm fade-in">
              <p className="text-gray-600 mb-6">"Our clients love having one place to access everything. It's professional and saves us hours every week."</p>
              <div className="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Mike" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-navy">Mike Chen</div>
                  <div className="text-sm text-gray-600">Agency Owner</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm fade-in">
              <p className="text-gray-600 mb-6">"The white-label feature is perfect. Our clients think we built this custom portal just for them."</p>
              <div className="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Lisa" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-navy">Lisa Rodriguez</div>
                  <div className="text-sm text-gray-600">Business Coach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="py-20 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center fade-in">
          <h2 className="text-5xl font-bold mb-6">Deliver a World-Class Client Experience</h2>
          <p className="text-xl text-gray-300 mb-8">Without the dev team. Start your free beta today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-electric text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
              Start Free Beta
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-navy transition-colors">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-2xl font-bold text-navy">NestBase</span>
            </div>
            <div className="flex space-x-8 text-gray-600">
              <span className="hover:text-navy transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-navy transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-navy transition-colors cursor-pointer">Support</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2024 NestBase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}



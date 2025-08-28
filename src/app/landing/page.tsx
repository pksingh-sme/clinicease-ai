'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CalendarIcon, 
  CreditCardIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentImage, setCurrentImage] = useState(0)
  
  const benefits = [
    {
      title: "Smart Scheduling",
      description: "AI-powered appointment scheduling with no-show prediction",
      icon: <CalendarIcon className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Intelligent Billing",
      description: "Automated ICD-10/CPT coding and payment processing",
      icon: <CreditCardIcon className="w-8 h-8 text-green-500" />
    },
    {
      title: "Patient Portal",
      description: "Secure access to medical records and appointments",
      icon: <UserGroupIcon className="w-8 h-8 text-purple-500" />
    },
    {
      title: "Secure Messaging",
      description: "HIPAA-compliant communication between patients and providers",
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal-500" />
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your healthcare needs",
      icon: <ClockIcon className="w-8 h-8 text-indigo-500" />
    }
  ]

  // Healthcare-related images for the carousel
  const heroImages = [
    {
      url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80",
      alt: "Modern healthcare facility with advanced medical equipment"
    },
    {
      url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      alt: "Doctor using digital tablet for patient records"
    },
    {
      url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80",
      alt: "Healthcare professionals in a modern clinic"
    },
    {
      url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      alt: "Patient receiving care in a medical facility"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % benefits.length)
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [benefits.length, heroImages.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden h-screen max-h-[800px]">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-0"></div>
        
        {/* Image Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((image, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image.url} 
                alt={image.alt} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ))}
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              Smarter Healthcare Management with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-10 animate-fade-in-delay">
              Streamline clinic operations with intelligent appointment scheduling, automated billing, and secure patient portals
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in-delay-2">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                Get Started
              </Button>
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                Book Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Benefits Carousel - Positioned at the bottom of the hero section */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white transition-all duration-500 hover:shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 transition-all duration-300 hover:scale-110">
                {benefits[currentSlide].icon}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 transition-all duration-500">{benefits[currentSlide].title}</h3>
                <p className="text-gray-600 text-lg transition-all duration-500">{benefits[currentSlide].description}</p>
              </div>
              <div className="flex space-x-2">
                {benefits.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-purple-600 scale-125' : 'bg-gray-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">Powerful Features for Modern Healthcare</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-delay">
            Everything you need to streamline clinic operations and enhance patient care
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-blue-200 group-hover:scale-110">
                <CalendarIcon className="w-8 h-8 text-blue-600 transition-all duration-300 group-hover:text-blue-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                AI predicts no-shows and enables automated overbooking to maximize provider efficiency
              </CardDescription>
            </CardContent>
          </Card>
          
          {/* Feature 2 */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-green-200 group-hover:scale-110">
                <CreditCardIcon className="w-8 h-8 text-green-600 transition-all duration-300 group-hover:text-green-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">Intelligent Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Automated ICD-10/CPT coding with Stripe integration and visual payment tracking
              </CardDescription>
            </CardContent>
          </Card>
          
          {/* Feature 3 */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-purple-200 group-hover:scale-110">
                <UserGroupIcon className="w-8 h-8 text-purple-600 transition-all duration-300 group-hover:text-purple-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">Patient Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Secure access to medical records, messaging, and appointments for patients
              </CardDescription>
            </CardContent>
          </Card>
          
          {/* Feature 4 */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-teal-200 group-hover:scale-110">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal-600 transition-all duration-300 group-hover:text-teal-700" />
              </div>
              <CardTitle className="text-xl text-gray-900">Secure Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                HIPAA-compliant real-time communication between patients and providers
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Get Started Today</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            Join thousands of healthcare providers who trust ClinicEase AI to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl font-bold">
              Start Free Trial
            </Button>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl font-bold">
              Schedule Demo
            </Button>
          </div>
          
          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 transition-all duration-300 hover:bg-white/20">
              <ShieldCheckIcon className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 transition-all duration-300 hover:bg-white/20">
              <ShieldCheckIcon className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-medium">Secure & Reliable</span>
            </div>
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 transition-all duration-300 hover:bg-white/20">
              <BuildingOfficeIcon className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-medium">Trusted by Clinics Nationwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ClinicEase AI</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md text-lg">
                Revolutionizing healthcare management with AI-powered automation, secure communication, and HIPAA-compliant data handling.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors hover:underline">About Us</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors hover:underline">Pricing</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors hover:underline">Contact</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors hover:underline">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors hover:underline">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors hover:underline">Blog</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors hover:underline">Support Center</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors hover:underline">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors hover:underline">API</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ClinicEase AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Building, 
  UserCheck, 
  Heart, 
  Lightbulb, 
  User,
  Check,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Diltak.ai?",
      answer: "Diltak.ai is an AI-powered mental health analytics platform designed for enterprises, educational institutions, and healthcare providers. We offer comprehensive emotional well-being solutions with real-time analytics and personalized support."
    },
    {
      question: "How does Diltak.ai help organizations?",
      answer: "Diltak.ai helps organizations by providing real-time emotional intelligence, comprehensive wellness analytics, and AI-driven support tools that boost workforce resilience, productivity, and retention."
    },
    {
      question: "Is Diltak.ai available for white-label integration?",
      answer: "Yes, Diltak.ai offers white-label solutions that can be seamlessly integrated into your existing platforms and branded according to your organization's needs."
    },
    {
      question: "Is Diltak.ai compliant with data privacy standards?",
      answer: "Absolutely. Diltak.ai is HIPAA-compliant and follows industry-leading security measures with end-to-end encryption to protect all sensitive data."
    },
    {
      question: "How is Diltak.ai different from traditional wellness apps?",
      answer: "Diltak.ai goes beyond traditional wellness apps by offering AI-powered emotional intelligence, real-time analytics, and comprehensive organizational insights that traditional apps cannot provide."
    },
    {
      question: "Can Diltak.ai integrate with our existing systems?",
      answer: "Yes, Diltak.ai offers flexible API integration options that can connect with your existing HR systems, communication platforms, and other workplace tools."
    },
    {
      question: "Can we see a live demo or try a pilot?",
      answer: "Absolutely! We offer live demos and pilot programs to help you experience the full capabilities of Diltak.ai before making a decision."
    },
    {
      question: "How does Diltak.ai improve ROI for enterprises?",
      answer: "Diltak.ai improves ROI by reducing absenteeism, increasing productivity, improving employee retention, and providing data-driven insights for better organizational decision-making."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">Diltak.ai</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-gray-800">
                  Login
                </Button>
              </Link>
              <Link href="/demo">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <p className="text-blue-400 text-sm font-medium mb-4">Meet Diltak.ai</p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
                Empower Your People.
                <br />
                <span className="text-blue-500">Elevate Mental Wellness.</span>
              </h1>
                          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mb-8">
              Diltak.ai has processed over 10K emotional conversations, training our AI models on diverse, 
              real-world data to accurately recognize emotions across demographics. With a rapidly growing dataset, 
              our beta model already surpasses standard wellness platforms in both engagement and empathy.
            </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Link href="/demo">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 flex items-center space-x-2">
                    <span>Set Up Demo</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-400">Used by leading companies around the world.</p>
            </div>
                          <div className="flex justify-center items-center">
                {/* Hero Image */}
                <div className="relative w-full h-96 rounded-2xl overflow-hidden">
                  <Image
                    src="/images/1745575454034.jpeg"
                    alt="Man with beard looking at monitors with AI interface"
                    fill
                    className="object-cover rounded-2xl"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
              </div>
          </div>
        </div>
      </section>

            {/* WellnessHub Solution Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-white font-serif">engagement</h1>
          </div>

          {/* Descriptive Text */}
          <div className="text-center mb-16">
            <p className="text-lg text-white max-w-4xl mx-auto leading-relaxed">
              Diltak.ai enables platforms to deliver real-time emotional intelligence, creating personalized, 
              empathetic user experiences that foster trust, increase retention, and drive business value.
            </p>
          </div>

          {/* Central Graphic with Features */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Background Dots Effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            {/* Central Diamond Logo */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-48 h-48 relative mb-16">
                {/* Diamond shape with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-red-600 transform rotate-45 rounded-lg flex items-center justify-center">
                  <div className="relative w-32 h-32 transform -rotate-45">
                    {/* Teal L-shape */}
                    <div className="absolute top-0 left-0 w-16 h-8 bg-teal-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 left-0 w-8 h-16 bg-teal-400 rounded-tl-lg"></div>
                    {/* Red L-shape */}
                    <div className="absolute bottom-0 right-0 w-16 h-8 bg-red-500 rounded-br-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-16 bg-red-500 rounded-br-lg"></div>
                  </div>
                </div>
                {/* Subtle outline */}
                <div className="absolute inset-0 border border-gray-400/30 transform rotate-45 rounded-lg"></div>
              </div>

              {/* Feature Labels in Single Row */}
              <div className="flex justify-center">
                <div className="flex space-x-8">
                  {/* Emotional Support */}
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-white" />
                    <span className="text-white text-sm font-medium">Emotional Support</span>
                  </div>

                  {/* Real-Time Empathy */}
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-white" />
                    <span className="text-white text-sm font-medium">Real-Time Empathy</span>
                  </div>

                  {/* Thoughtful Guidance */}
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-white" />
                    <span className="text-white text-sm font-medium">Thoughtful Guidance</span>
                  </div>

                  {/* Your AI Virtual Friend */}
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-white" />
                    <span className="text-white text-sm font-medium">Your AI Virtual Friend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhance Your Well-Being Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                Enhance Your Well-Being with WellnessHub Scalable AI Tool
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Diltak.ai helps organizations offer real-time emotional intelligence and mental clarity tools 
                — boosting workforce resilience, productivity, and retention.
              </p>
              <Link href="/contact">
                <Button size="lg" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 flex items-center space-x-2">
                  <span>Contact Us</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              {/* Well-being Graphic */}
              <div className="relative w-64 h-64 rounded-full overflow-hidden">
                <Image
                  src="/images/Web-App-Empower-Image-1.webp"
                  alt="Well-being and connection graphic"
                  fill
                  className="object-cover rounded-full"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin-slow"></div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Live Emotional Intelligence at Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Enable your team or users to receive instant, AI-driven emotional support — building trust 
                  and satisfaction in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Actionable Well-being Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Gain team-wide insights into emotional trends and mental well-being — informing smarter 
                  organizational decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Enterprise-Grade Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Protect every interaction with full encryption and compliance — trusted by businesses 
                  to handle sensitive data responsibly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently asked questions</h2>
            <p className="text-gray-300 mb-8">Still have more questions? Don&apos;t hesitate to contact us!</p>
            <Link href="/contact">
              <Button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 flex items-center space-x-2">
                <span>Contact Us</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white text-left">{faq.question}</CardTitle>
                    {openFaq === index ? (
                      <Minus className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Plus className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <p className="text-gray-300">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WellnessHub Understand Your Emotions Section */}
     

      {/* Footer */}
      
    </div>
  );
}
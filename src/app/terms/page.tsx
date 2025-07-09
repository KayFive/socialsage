"use client"

// app/terms/page.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const TermsOfService = () => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms', anchor: 'acceptance' },
    { id: 'description', title: '2. Description of Service', anchor: 'description' },
    { id: 'user-accounts', title: '3. User Accounts and Registration', anchor: 'user-accounts' },
    { id: 'acceptable-use', title: '4. Acceptable Use Policy', anchor: 'acceptable-use' },
    { id: 'instagram-integration', title: '5. Instagram Integration', anchor: 'instagram-integration' },
    { id: 'data-privacy', title: '6. Data and Privacy', anchor: 'data-privacy' },
    { id: 'intellectual-property', title: '7. Intellectual Property', anchor: 'intellectual-property' },
    { id: 'service-availability', title: '8. Service Availability', anchor: 'service-availability' },
    { id: 'limitation-liability', title: '9. Limitation of Liability', anchor: 'limitation-liability' },
    { id: 'indemnification', title: '10. Indemnification', anchor: 'indemnification' },
    { id: 'termination', title: '11. Termination', anchor: 'termination' },
    { id: 'modifications', title: '12. Modifications to Terms', anchor: 'modifications' },
    { id: 'governing-law', title: '13. Governing Law', anchor: 'governing-law' },
    { id: 'contact', title: '14. Contact Information', anchor: 'contact' }
  ];

  const CollapsibleSection = ({ id, title, children, defaultOpen = false }: {
    id: string;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const isExpanded = expandedSections[id] ?? defaultOpen;
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-6 py-4 bg-white">
            <div className="prose prose-gray max-w-none">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Terms of Service - SocialSage</title>
        <meta name="description" content="SocialSage Terms of Service - Legal terms and conditions for using our service." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://socialsage-app.vercel.app/terms" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-gray-600 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                    Effective: July 7, 2025
                  </span>
                  <span className="text-sm">Last Updated: July 7, 2025</span>
                </p>
              </div>
              <a 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                ← Back to SocialSage
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            
            {/* Table of Contents - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 lg:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.anchor}`}
                        className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1 transition-colors duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(section.anchor)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                  
                  {/* Quick Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <a
                        href="/privacy"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        📄 Privacy Policy
                      </a>
                      <a
                        href="mailto:legal@socialsage.app"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        ⚖️ Legal Questions
                      </a>
                      <a
                        href="mailto:support@socialsage.app"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        🎧 Get Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">

                {/* Acceptance of Terms */}
                <CollapsibleSection id="acceptance" title="1. Acceptance of Terms" defaultOpen={true}>
                  <div id="acceptance">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800">
                        <strong>Welcome to SocialSage!</strong> By accessing or using our service, you agree to be bound by these Terms of Service and our Privacy Policy.
                      </p>
                    </div>
                    <p className="mb-4">
                      These Terms of Service ("Terms") constitute a legally binding agreement between you and SocialSage regarding your use of our social media analytics platform and related services.
                    </p>
                    <p className="text-gray-700">
                      If you do not agree to these Terms, please do not use our service.
                    </p>
                  </div>
                </CollapsibleSection>

                {/* Description of Service */}
                <CollapsibleSection id="description" title="2. Description of Service">
                  <div id="description">
                    <p className="mb-4">
                      SocialSage is a social media analytics platform that provides insights, analytics, and recommendations for Instagram accounts through integration with Meta's Instagram API.
                    </p>
                    
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-pink-900 mb-2">📊 Our Services Include:</h4>
                      <ul className="text-pink-800 text-sm space-y-1">
                        <li>• Instagram account analytics and performance tracking</li>
                        <li>• AI-powered content recommendations and insights</li>
                        <li>• Optimal posting time and frequency analysis</li>
                        <li>• Follower growth tracking and engagement metrics</li>
                        <li>• Content performance analysis by type and format</li>
                        <li>• Historical data tracking and trend analysis</li>
                      </ul>
                    </div>

                    <p className="text-gray-700">
                      Our service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
                    </p>
                  </div>
                </CollapsibleSection>

                {/* User Accounts */}
                <CollapsibleSection id="user-accounts" title="3. User Accounts and Registration">
                  <div id="user-accounts">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Account Creation</h4>
                        <ul className="text-gray-700 space-y-1 ml-4">
                          <li>• You must provide accurate and complete information during registration</li>
                          <li>• You are responsible for maintaining the security of your account credentials</li>
                          <li>• You must be at least 13 years old to use our service</li>
                          <li>• One person may maintain only one account</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Account Responsibilities</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <ul className="text-yellow-800 text-sm space-y-1">
                            <li>• Keep your login credentials secure and confidential</li>
                            <li>• Notify us immediately of any unauthorized account access</li>
                            <li>• Ensure your Instagram account complies with Meta's terms</li>
                            <li>• Use only Instagram Business or Creator accounts for full functionality</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Acceptable Use Policy */}
                <CollapsibleSection id="acceptable-use" title="4. Acceptable Use Policy">
                  <div id="acceptable-use">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-3">✅ Permitted Uses</h4>
                        <ul className="text-green-700 text-sm space-y-1">
                          <li>• Analyze your own Instagram account performance</li>
                          <li>• Generate insights for legitimate business purposes</li>
                          <li>• Use AI recommendations to improve content strategy</li>
                          <li>• Export your own data for personal use</li>
                          <li>• Share aggregated, non-personal insights</li>
                        </ul>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-3">❌ Prohibited Uses</h4>
                        <ul className="text-red-700 text-sm space-y-1">
                          <li>• Access accounts you don't own or control</li>
                          <li>• Violate Instagram's Terms of Service or Community Guidelines</li>
                          <li>• Use the service for spam, harassment, or illegal activities</li>
                          <li>• Attempt to reverse engineer or hack our systems</li>
                          <li>• Share login credentials or account access</li>
                          <li>• Use automated tools to access our service</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Instagram Integration */}
                <CollapsibleSection id="instagram-integration" title="5. Instagram Integration">
                  <div id="instagram-integration">
                    <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-pink-900 mb-2">📱 Instagram API Compliance</h4>
                      <p className="text-pink-800 text-sm">
                        Our Instagram integration is fully compliant with Meta's Platform Policy and Instagram's Terms of Service.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Your Responsibilities</h4>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• Maintain a valid Instagram Business or Creator account</li>
                          <li>• Comply with Instagram's Terms of Service and Community Guidelines</li>
                          <li>• Ensure you have rights to the content you analyze through our service</li>
                          <li>• Respect the privacy and rights of your followers and commenters</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Commitments</h4>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• We only access data you explicitly authorize through Instagram's OAuth</li>
                          <li>• We comply with all Instagram API rate limits and usage policies</li>
                          <li>• We do not store your Instagram login credentials</li>
                          <li>• We respect Instagram's data usage and sharing restrictions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Data and Privacy */}
                <CollapsibleSection id="data-privacy" title="6. Data and Privacy">
                  <div id="data-privacy">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        Your privacy is important to us. Please review our comprehensive <a href="/privacy" className="font-medium underline hover:text-blue-900">Privacy Policy</a> for detailed information about how we collect, use, and protect your data.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Key Privacy Principles</h4>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• We never sell your personal data</li>
                          <li>• You maintain ownership of your Instagram content</li>
                          <li>• You can export or delete your data at any time</li>
                          <li>• We use industry-standard security measures</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Your Data Rights</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white border rounded-lg p-3">
                            <h6 className="font-medium text-gray-900 mb-2">Access & Export</h6>
                            <p className="text-gray-600 text-sm">Request and download all your data</p>
                          </div>
                          <div className="bg-white border rounded-lg p-3">
                            <h6 className="font-medium text-gray-900 mb-2">Correction</h6>
                            <p className="text-gray-600 text-sm">Update or correct your information</p>
                          </div>
                          <div className="bg-white border rounded-lg p-3">
                            <h6 className="font-medium text-gray-900 mb-2">Deletion</h6>
                            <p className="text-gray-600 text-sm">Delete your account and all data</p>
                          </div>
                          <div className="bg-white border rounded-lg p-3">
                            <h6 className="font-medium text-gray-900 mb-2">Portability</h6>
                            <p className="text-gray-600 text-sm">Transfer your data to another service</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Intellectual Property */}
                <CollapsibleSection id="intellectual-property" title="7. Intellectual Property">
                  <div id="intellectual-property">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Intellectual Property</h4>
                        <p className="text-gray-700 text-sm mb-3">
                          SocialSage, our algorithms, analytics, and AI recommendations are proprietary and protected by intellectual property laws.
                        </p>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• You may not copy, modify, or distribute our software</li>
                          <li>• Our analytics algorithms and AI models are confidential</li>
                          <li>• All trademarks and logos are our property</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Your Content Rights</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <ul className="text-green-700 text-sm space-y-1">
                            <li>• You retain ownership of your Instagram content</li>
                            <li>• We do not claim rights to your posts, images, or captions</li>
                            <li>• You grant us limited rights to analyze your content for insights</li>
                            <li>• You can revoke these rights by disconnecting your account</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Service Availability */}
                <CollapsibleSection id="service-availability" title="8. Service Availability">
                  <div id="service-availability">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Service Uptime</h4>
                        <p className="text-gray-700 text-sm mb-3">
                          While we strive for high availability, we do not guarantee uninterrupted service access.
                        </p>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• Scheduled maintenance may cause temporary service interruptions</li>
                          <li>• Instagram API limitations may affect data availability</li>
                          <li>• We may suspend service for security or legal reasons</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Third-Party Dependencies</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">
                            Our service depends on Instagram's API and other third-party services. Changes to these services may affect our functionality.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Limitation of Liability */}
                <CollapsibleSection id="limitation-liability" title="9. Limitation of Liability">
                  <div id="limitation-liability">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-red-900 mb-2">⚖️ Important Legal Notice</h4>
                      <p className="text-red-800 text-sm">
                        Our liability is limited to the maximum extent permitted by law. Please read this section carefully.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Service Disclaimers</h4>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• The service is provided "as is" without warranties</li>
                          <li>• We do not guarantee the accuracy of analytics or recommendations</li>
                          <li>• AI insights are for informational purposes only</li>
                          <li>• You use the service at your own risk</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Liability Limitations</h4>
                        <p className="text-gray-700 text-sm mb-2">
                          To the maximum extent permitted by law, SocialSage shall not be liable for:
                        </p>
                        <ul className="text-gray-700 text-sm space-y-1 ml-4">
                          <li>• Indirect, incidental, or consequential damages</li>
                          <li>• Loss of profits, data, or business opportunities</li>
                          <li>• Damages exceeding the amount you paid for the service</li>
                          <li>• Issues arising from Instagram API changes or limitations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Termination */}
                <CollapsibleSection id="termination" title="11. Termination">
                  <div id="termination">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Your Right to Terminate</h4>
                        <ul className="text-gray-700 text-sm space-y-1">
                          <li>• You may terminate your account at any time</li>
                          <li>• You can disconnect Instagram integration anytime</li>
                          <li>• You may request complete data deletion</li>
                          <li>• No fees or penalties for termination</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Right to Terminate</h4>
                        <ul className="text-gray-700 text-sm space-y-1">
                          <li>• Violation of these Terms</li>
                          <li>• Fraudulent or illegal activity</li>
                          <li>• Abuse of our service or systems</li>
                          <li>• Extended account inactivity</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Data After Termination</h4>
                      <p className="text-blue-800 text-sm">
                        Upon termination, we will delete your account data within 30 days, except where retention is required by law or legitimate business interests.
                      </p>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Contact Information */}
                <CollapsibleSection id="contact" title="14. Contact Information">
                  <div id="contact">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-900 mb-4">📞 Questions about these Terms?</h4>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-blue-800 mb-2">Contact Methods</h5>
                          <div className="space-y-2">
                            <a href="mailto:legal@socialsage.app" className="flex items-center text-blue-700 hover:text-blue-900">
                              <span className="mr-2">⚖️</span>
                              <span>legal@socialsage.app</span>
                            </a>
                            <a href="mailto:support@socialsage.app" className="flex items-center text-blue-700 hover:text-blue-900">
                              <span className="mr-2">🎧</span>
                              <span>support@socialsage.app</span>
                            </a>
                            <div className="flex items-center text-blue-700">
                              <span className="mr-2">📍</span>
                              <span>5665 W. Wilshire Blvd #1227 Los Angeles, CA 90036</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-blue-800 mb-2">Legal Disputes</h5>
                          <p className="text-blue-700 text-sm">
                            For formal legal matters, please contact our legal department. We're committed to resolving disputes fairly and efficiently.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">© 2025 SocialSage. All rights reserved.</p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
                <a href="/terms" className="text-gray-500 hover:text-gray-900 font-medium">Terms of Service</a>
                <a href="/privacy" className="text-gray-500 hover:text-gray-900">Privacy Policy</a>
                <a href="mailto:support@socialsage.app" className="text-gray-500 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TermsOfService;
"use client"

// pages/privacy.tsx or app/privacy/page.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const PrivacyPolicy = () => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections = [
    { id: 'introduction', title: '1. Introduction', anchor: 'introduction' },
    { id: 'information-collect', title: '2. Information We Collect', anchor: 'information-collect' },
    { id: 'how-we-use', title: '3. How We Use Your Information', anchor: 'how-we-use' },
    { id: 'data-sharing', title: '4. Data Sharing and Disclosure', anchor: 'data-sharing' },
    { id: 'data-retention', title: '5. Data Retention', anchor: 'data-retention' },
    { id: 'data-security', title: '6. Data Security', anchor: 'data-security' },
    { id: 'your-rights', title: '7. Your Rights and Choices', anchor: 'your-rights' },
    { id: 'instagram-compliance', title: '8. Instagram Data Usage Compliance', anchor: 'instagram-compliance' },
    { id: 'international-transfers', title: '9. International Data Transfers', anchor: 'international-transfers' },
    { id: 'children-privacy', title: '10. Children\'s Privacy', anchor: 'children-privacy' },
    { id: 'policy-changes', title: '11. Changes to This Privacy Policy', anchor: 'policy-changes' },
    { id: 'contact', title: '12. Contact Information', anchor: 'contact' },
    { id: 'jurisdiction', title: '13. Jurisdiction-Specific Information', anchor: 'jurisdiction' },
    { id: 'effective-date', title: '14. Effective Date and Acceptance', anchor: 'effective-date' }
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
        <title>Privacy Policy - SocialSage</title>
        <meta name="description" content="SocialSage Privacy Policy - How we collect, use, and protect your data." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://socialsage-app.vercel.app/privacy" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
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
                        href="mailto:privacy@socialsage.app"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        📧 Contact Privacy Team
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

                {/* Introduction */}
                <CollapsibleSection id="introduction" title="1. Introduction" defaultOpen={true}>
                  <div id="introduction">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800">
                        <strong>Welcome to SocialSage!</strong> This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social media analytics platform and services.
                      </p>
                    </div>
                    <p className="mb-4">
                      This policy applies to our website, mobile applications, and all related services (the "Service").
                    </p>
                    <p className="text-gray-700">
                      By using SocialSage, you consent to the data practices described in this Privacy Policy.
                    </p>
                  </div>
                </CollapsibleSection>

                {/* Information We Collect */}
                <CollapsibleSection id="information-collect" title="2. Information We Collect">
                  <div id="information-collect">
                    
                    <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-pink-900 mb-2">📸 Instagram Data (via Instagram API)</h4>
                      <p className="text-pink-800 text-sm">When you connect your Instagram account, we collect:</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">👤 Profile Information</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Username and user ID</li>
                          <li>• Follower count and following count</li>
                          <li>• Media (post) count</li>
                          <li>• Profile picture and basic profile data</li>
                        </ul>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">📱 Media & Content Data</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Post content (images, videos, captions)</li>
                          <li>• Post metadata (timestamps, media type)</li>
                          <li>• Engagement metrics (likes, comments, shares)</li>
                          <li>• Reach and impression data</li>
                        </ul>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">💬 Comments & Interactions</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Comments on your posts</li>
                          <li>• Follower engagement patterns</li>
                          <li>• Top follower identification</li>
                        </ul>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">📊 Analytics & Insights</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Historical follower growth data</li>
                          <li>• Optimal posting times</li>
                          <li>• Content type performance analysis</li>
                          <li>• Engagement rate calculations</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">🔐 Account & Authentication Data</h4>
                        <ul className="text-gray-700 space-y-1 ml-4">
                          <li>• Email address and account credentials</li>
                          <li>• Account creation date and login history</li>
                          <li>• Authentication tokens for connected accounts</li>
                          <li>• Account preferences and settings</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">📈 Usage & Analytics Data</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Session Info</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Session duration</li>
                                <li>• Pages visited</li>
                                <li>• Feature usage</li>
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Device Data</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Device type</li>
                                <li>• Browser & OS</li>
                                <li>• General location</li>
                              </ul>
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Engagement</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Button clicks</li>
                                <li>• Feature interactions</li>
                                <li>• User feedback</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* How We Use Your Information */}
                <CollapsibleSection id="how-we-use" title="3. How We Use Your Information">
                  <div id="how-we-use">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3">🎯 Primary Service Functions</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <h6 className="font-medium text-blue-800">Analytics & Insights:</h6>
                            <ul className="text-blue-700 ml-4 space-y-1">
                              <li>• Generate performance analytics</li>
                              <li>• Calculate engagement rates</li>
                              <li>• Identify optimal posting times</li>
                              <li>• Track follower growth trends</li>
                            </ul>
                          </div>
                          <div>
                            <h6 className="font-medium text-blue-800">AI-Powered Recommendations:</h6>
                            <ul className="text-blue-700 ml-4 space-y-1">
                              <li>• Personalized content suggestions</li>
                              <li>• Timing & frequency recommendations</li>
                              <li>• Growth strategies</li>
                              <li>• Custom insights & action plans</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">🔧 Service Improvement</h4>
                          <ul className="text-green-700 text-sm space-y-1">
                            <li>• Improve algorithms & accuracy</li>
                            <li>• Develop new features</li>
                            <li>• Conduct product research</li>
                            <li>• Quality assurance & testing</li>
                          </ul>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">📞 Communication & Support</h4>
                          <ul className="text-purple-700 text-sm space-y-1">
                            <li>• Provide customer support</li>
                            <li>• Send service notifications</li>
                            <li>• Share product updates</li>
                            <li>• Account & security info</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Data Sharing */}
                <CollapsibleSection id="data-sharing" title="4. Data Sharing and Disclosure">
                  <div id="data-sharing">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800">
                        <strong>🔒 We do not sell your personal data.</strong> We only share data with trusted service providers necessary for our operations.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">🤝 Third-Party Service Providers</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-medium text-gray-900 mb-2">Infrastructure</h6>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Supabase (database)</li>
                              <li>• Vercel (hosting)</li>
                            </ul>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-medium text-gray-900 mb-2">Analytics</h6>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Mixpanel (analytics)</li>
                              <li>• Performance monitoring</li>
                            </ul>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-medium text-gray-900 mb-2">Instagram</h6>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Meta/Instagram APIs</li>
                              <li>• Platform Policy compliant</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Data Retention */}
                <CollapsibleSection id="data-retention" title="5. Data Retention">
                  <div id="data-retention">
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">📸 Instagram Data</h4>
                        <ul className="text-red-700 text-sm space-y-1">
                          <li>• <strong>Active Accounts:</strong> Retained while connected</li>
                          <li>• <strong>Disconnected Accounts:</strong> Deleted within 90 days</li>
                          <li>• <strong>Historical Analytics:</strong> Aggregated, non-identifiable data may be retained</li>
                        </ul>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">👤 Account Data</h4>
                          <ul className="text-blue-700 text-sm space-y-1">
                            <li>• <strong>Active:</strong> Retained while active</li>
                            <li>• <strong>Inactive 2+ years:</strong> May be deleted</li>
                            <li>• <strong>Deleted:</strong> Removed within 30 days</li>
                          </ul>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">📊 Analytics Data</h4>
                          <ul className="text-green-700 text-sm space-y-1">
                            <li>• <strong>Usage:</strong> Up to 2 years</li>
                            <li>• <strong>Support:</strong> Up to 3 years</li>
                            <li>• <strong>Legal:</strong> As required by law</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Your Rights */}
                <CollapsibleSection id="your-rights" title="7. Your Rights and Choices">
                  <div id="your-rights">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-green-800">
                        <strong>✨ You have full control over your data!</strong> Here are your rights and how to exercise them.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">📥 Access & Portability</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Request a copy of your data</li>
                            <li>• Export analytics & reports</li>
                            <li>• Access account settings</li>
                          </ul>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">✏️ Correction & Updates</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Update account information</li>
                            <li>• Correct inaccurate data</li>
                            <li>• Modify connected accounts</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">🗑️ Deletion & Disconnection</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Delete your SocialSage account</li>
                            <li>• Disconnect Instagram anytime</li>
                            <li>• Request specific data deletion</li>
                          </ul>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">📧 Communication Preferences</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Opt out of marketing emails</li>
                            <li>• Manage notification settings</li>
                            <li>• Control tracking preferences</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">🇪🇺 EU/UK Users (GDPR)</h4>
                        <ul className="text-blue-700 text-sm space-y-1">
                          <li>• Right to rectification & erasure</li>
                          <li>• Right to data portability</li>
                          <li>• Right to object to processing</li>
                          <li>• Right to withdraw consent</li>
                        </ul>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">🇺🇸 California Users (CCPA)</h4>
                        <ul className="text-orange-700 text-sm space-y-1">
                          <li>• Right to know what's collected</li>
                          <li>• Right to delete personal info</li>
                          <li>• Right to opt-out of sale</li>
                          <li>• Right to non-discrimination</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Instagram Compliance */}
                <CollapsibleSection id="instagram-compliance" title="8. Instagram Data Usage Compliance">
                  <div id="instagram-compliance">
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-pink-900 mb-2">📱 Meta Platform Policy Compliance</h4>
                      <p className="text-pink-800 text-sm">Our use of Instagram data strictly complies with Meta's Platform Policy</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">✅ What We Do</h4>
                        <ul className="text-gray-700 text-sm space-y-2">
                          <li>✅ Use data solely for analytics services</li>
                          <li>✅ Respect rate limits & API guidelines</li>
                          <li>✅ Provide data only to account owners</li>
                          <li>✅ Follow all Instagram policies</li>
                        </ul>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">❌ What We Don't Do</h4>
                        <ul className="text-gray-700 text-sm space-y-2">
                          <li>❌ Sell or share Instagram data</li>
                          <li>❌ Use content for advertising</li>
                          <li>❌ Store login credentials</li>
                          <li>❌ Access unauthorized data</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">🔐 Your Control</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• You maintain full control over your Instagram account</li>
                        <li>• You can disconnect anytime through your profile settings</li>
                        <li>• We only access data you explicitly authorize</li>
                        <li>• All access is through Instagram's official OAuth process</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Contact Information */}
                <CollapsibleSection id="contact" title="12. Contact Information">
                  <div id="contact">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-900 mb-4">📞 Questions about this Privacy Policy?</h4>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-blue-800 mb-2">Contact Methods</h5>
                          <div className="space-y-2">
                            <a href="mailto:privacy@socialsage.app" className="flex items-center text-blue-700 hover:text-blue-900">
                              <span className="mr-2">📧</span>
                              <span>privacy@socialsage.app</span>
                            </a>
                            <a href="mailto:support@socialsage.app" className="flex items-center text-blue-700 hover:text-blue-900">
                              <span className="mr-2">🎧</span>
                              <span>support@socialsage.app</span>
                            </a>
                            <div className="flex items-center text-blue-700">
                              <span className="mr-2">📍</span>
                              <span> 5665 W. Wilshire Blvd #1227 Los Angeles, CA 90036</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-blue-800 mb-2">Response Times</h5>
                          <ul className="text-blue-700 text-sm space-y-1">
                            <li>• Privacy inquiries: Within 48 hours</li>
                            <li>• Data requests: Within 30 days</li>
                            <li>• General support: Within 24 hours</li>
                            <li>• Urgent issues: Same day</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Effective Date */}
                <CollapsibleSection id="effective-date" title="14. Effective Date and Acceptance">
                  <div id="effective-date">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <h4 className="font-semibold text-gray-900 mb-3">📅 Policy Information</h4>
                      <p className="text-gray-700 mb-4">
                        This Privacy Policy is effective as of <strong>July 7, 2025</strong>. 
                        By using SocialSage, you acknowledge that you have read and understood 
                        this Privacy Policy and agree to its terms.
                      </p>
                      
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✅ Current Version - Last Updated: July 7, 2025
                      </div>
                      
                      <p className="text-gray-600 text-sm mt-4">
                        Please review this policy periodically for any changes.
                      </p>
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
                <a href="/terms" className="text-gray-500 hover:text-gray-900">Terms of Service</a>
                <a href="/privacy" className="text-gray-500 hover:text-gray-900 font-medium">Privacy Policy</a>
                <a href="mailto:support@socialsage.app" className="text-gray-500 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PrivacyPolicy;
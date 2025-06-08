import MainLayout from '@/components/layout/MainLayout';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">About SocialSage</h1>
        
        <div className="prose lg:prose-lg mx-auto">
          <p>
            SocialSage is a powerful analytics platform designed to help businesses and content creators understand and optimize their Instagram presence.
          </p>
          
          <p>
            Our mission is to provide actionable insights that help you grow your audience, increase engagement, and achieve your social media goals.
          </p>
          
          <h2>What We Offer</h2>
          
          <ul>
            <li>Comprehensive performance analytics</li>
            <li>Content strategy recommendations</li>
            <li>Audience insights and growth tracking</li>
            <li>Posting schedule optimization</li>
            <li>AI-powered recommendations</li>
          </ul>
          
          <h2>Our Story</h2>
          
          <p>
            SocialSage was founded in 2025 with a simple goal: make professional-level Instagram analytics accessible to everyone. Whether you're a small business, an influencer, or a large brand, our platform helps you understand what's working and how to improve.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
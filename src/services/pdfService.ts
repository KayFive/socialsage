// src/services/pdfService.ts
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';

interface ReportData {
  profile: {
    username: string;
    name: string;
    bio?: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    profile_picture_url: string;
    is_verified: boolean;
    account_type: string;
  };
  summary: {
    overallScore: number;
    keyMetrics: {
      engagement: number;
      followers: number;
      posts: number;
      [key: string]: any;
    };
    strengths: string[];
    weaknesses: string[];
  };
  engagementAnalysis: {
    overview: {
      totalEngagement: number;
      engagementRate: number;
      commentLikeRatio: number;
    };
    breakdown: {
      likes: number;
      comments: number;
      saves: number;
    };
    trends: Array<{
      date: string;
      engagementRate: number;
    }>;
  };
  audienceInsights: {
    demographics: {
      gender: any;
      age: any;
      locations: Array<{
        country: string;
        city?: string;
        percentage: number;
      }>;
    };
  };
  contentAnalysis: {
    topPosts: Array<{
      id: string;
      media_url: string;
      caption?: string;
      like_count: number;
      comments_count: number;
    }>;
    contentPatterns: {
      optimalCaptionLength?: number;
      hashtagsImportant?: boolean;
      [key: string]: any;
    };
    captionAnalysis: {
      averageLength: number;
    };
  };
  growthOpportunities: Array<{
    area: string;
    description: string;
    impact: string;
    difficulty: string;
  }>;
  recommendations: Array<{
    category: string;
    items: string[];
  }>;
  actionPlan?: {
    title: string;
    weeks: Array<{
      title: string;
      tasks: string[];
    }>;
  };
}

export async function generatePDF(reportData: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pageWidth = 595;
  const pageHeight = 842;
  const margins = { top: 50, bottom: 50, left: 50, right: 50 };
  const brandColor = rgb(0.4, 0.3, 0.9); // Indigo color
  const textColor = rgb(0.1, 0.1, 0.1);
  const lightGray = rgb(0.9, 0.9, 0.9);

  // Add cover page
  const coverPage = doc.addPage([pageWidth, pageHeight]);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  // Title
  coverPage.drawText('Instagram Analytics Report', {
    x: margins.left,
    y: pageHeight - 150,
    size: 32,
    font: boldFont,
    color: brandColor,
  });

  // Username
  coverPage.drawText(`@${reportData.profile.username}`, {
    x: margins.left,
    y: pageHeight - 200,
    size: 24,
    font: regularFont,
    color: textColor,
  });

  // Date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  coverPage.drawText(`Generated on ${date}`, {
    x: margins.left,
    y: pageHeight - 240,
    size: 14,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Overall Score
  const scoreSize = 60;
  const scoreX = pageWidth / 2 - scoreSize / 2;
  const scoreY = pageHeight / 2;

  coverPage.drawText(reportData.summary.overallScore.toString(), {
    x: scoreX,
    y: scoreY,
    size: scoreSize,
    font: boldFont,
    color: brandColor,
  });

  coverPage.drawText('Overall Score', {
    x: pageWidth / 2 - 40,
    y: scoreY - 30,
    size: 16,
    font: regularFont,
    color: textColor,
  });

  // Branding
  coverPage.drawText('SocialSage', {
    x: pageWidth / 2 - 35,
    y: margins.bottom,
    size: 12,
    font: regularFont,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Profile Overview Page
  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margins.top;

  currentPage.drawText('Profile Overview', {
    x: margins.left,
    y: currentY,
    size: 24,
    font: boldFont,
    color: brandColor,
  });

  currentY -= 40;

  // Profile details
  const profileDetails = [
    { label: 'Username', value: `@${reportData.profile.username}` },
    { label: 'Full Name', value: reportData.profile.name },
    { label: 'Account Type', value: reportData.profile.account_type },
    { label: 'Verified', value: reportData.profile.is_verified ? 'Yes' : 'No' },
    { label: 'Posts', value: reportData.profile.media_count.toLocaleString() },
    { label: 'Followers', value: reportData.profile.followers_count.toLocaleString() },
    { label: 'Following', value: reportData.profile.follows_count.toLocaleString() },
  ];

  for (const detail of profileDetails) {
    currentPage.drawText(`${detail.label}: ${detail.value}`, {
      x: margins.left,
      y: currentY,
      size: 12,
      font: regularFont,
      color: textColor,
    });
    currentY -= 20;
  }

  // Key Metrics Page
  currentPage = doc.addPage([pageWidth, pageHeight]);
  currentY = pageHeight - margins.top;

  currentPage.drawText('Key Metrics & Insights', {
    x: margins.left,
    y: currentY,
    size: 24,
    font: boldFont,
    color: brandColor,
  });

  currentY -= 40;

  // Engagement metrics
  currentPage.drawText('Engagement Metrics:', {
    x: margins.left,
    y: currentY,
    size: 16,
    font: boldFont,
    color: textColor,
  });

  currentY -= 25;

  const engagementMetrics = [
    { label: 'Engagement Rate', value: `${reportData.summary.keyMetrics.engagement.toFixed(2)}%` },
    { label: 'Total Engagement', value: reportData.engagementAnalysis.overview.totalEngagement.toLocaleString() },
    { label: 'Total Likes', value: reportData.engagementAnalysis.breakdown.likes.toLocaleString() },
    { label: 'Total Comments', value: reportData.engagementAnalysis.breakdown.comments.toLocaleString() },
    { label: 'Comment/Like Ratio', value: reportData.engagementAnalysis.overview.commentLikeRatio.toFixed(2) },
  ];

  for (const metric of engagementMetrics) {
    currentPage.drawText(`${metric.label}: ${metric.value}`, {
      x: margins.left + 20,
      y: currentY,
      size: 12,
      font: regularFont,
      color: textColor,
    });
    currentY -= 20;
  }

  currentY -= 20;

  // Strengths
  currentPage.drawText('Key Strengths:', {
    x: margins.left,
    y: currentY,
    size: 16,
    font: boldFont,
    color: textColor,
  });

  currentY -= 25;

  for (const strength of reportData.summary.strengths.slice(0, 3)) {
    const lines = wrapText(strength, 70);
    for (const line of lines) {
      currentPage.drawText(`• ${line}`, {
        x: margins.left + 20,
        y: currentY,
        size: 11,
        font: regularFont,
        color: textColor,
      });
      currentY -= 18;
    }
    currentY -= 5;
  }

  // Audience Demographics Page
  currentPage = doc.addPage([pageWidth, pageHeight]);
  currentY = pageHeight - margins.top;

  currentPage.drawText('Audience Demographics', {
    x: margins.left,
    y: currentY,
    size: 24,
    font: boldFont,
    color: brandColor,
  });

  currentY -= 40;

  // Top locations
  currentPage.drawText('Top Locations:', {
    x: margins.left,
    y: currentY,
    size: 16,
    font: boldFont,
    color: textColor,
  });

  currentY -= 25;

  for (const location of reportData.audienceInsights.demographics.locations.slice(0, 5)) {
    currentPage.drawText(`• ${location.country}${location.city ? `, ${location.city}` : ''}: ${location.percentage.toFixed(1)}%`, {
      x: margins.left + 20,
      y: currentY,
      size: 12,
      font: regularFont,
      color: textColor,
    });
    currentY -= 20;
  }

  // Recommendations Page
  currentPage = doc.addPage([pageWidth, pageHeight]);
  currentY = pageHeight - margins.top;

  currentPage.drawText('Recommendations', {
    x: margins.left,
    y: currentY,
    size: 24,
    font: boldFont,
    color: brandColor,
  });

  currentY -= 40;

  // Growth opportunities
  currentPage.drawText('Growth Opportunities:', {
    x: margins.left,
    y: currentY,
    size: 16,
    font: boldFont,
    color: textColor,
  });

  currentY -= 25;

  for (const opportunity of reportData.growthOpportunities.slice(0, 3)) {
    currentPage.drawText(`${opportunity.area} (${opportunity.impact} Impact)`, {
      x: margins.left + 20,
      y: currentY,
      size: 12,
      font: boldFont,
      color: textColor,
    });
    currentY -= 18;

    const descLines = wrapText(opportunity.description, 65);
    for (const line of descLines) {
      currentPage.drawText(line, {
        x: margins.left + 30,
        y: currentY,
        size: 10,
        font: regularFont,
        color: textColor,
      });
      currentY -= 16;
    }
    currentY -= 10;
  }

  // Key recommendations
  if (currentY < 300) {
    currentPage = doc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margins.top;
  }

  currentPage.drawText('Key Recommendations:', {
    x: margins.left,
    y: currentY,
    size: 16,
    font: boldFont,
    color: textColor,
  });

  currentY -= 25;

  for (const category of reportData.recommendations.slice(0, 2)) {
    currentPage.drawText(category.category, {
      x: margins.left + 20,
      y: currentY,
      size: 12,
      font: boldFont,
      color: textColor,
    });
    currentY -= 18;

    for (const item of category.items.slice(0, 3)) {
      const itemLines = wrapText(item, 65);
      for (const line of itemLines) {
        currentPage.drawText(`• ${line}`, {
          x: margins.left + 30,
          y: currentY,
          size: 10,
          font: regularFont,
          color: textColor,
        });
        currentY -= 16;
      }
    }
    currentY -= 10;
  }

  // Add footers to all pages
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    if (index === 0) return; // Skip cover page

    page.drawText(`Page ${index} of ${pages.length - 1}`, {
      x: pageWidth / 2 - 30,
      y: margins.bottom - 20,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText('SocialSage Analytics Report', {
      x: margins.left,
      y: margins.bottom - 20,
      size: 10,
      font: regularFont,
      color: rgb(0.7, 0.7, 0.7),
    });
  });

  return await doc.save();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
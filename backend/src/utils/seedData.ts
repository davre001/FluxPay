import { createJobRecord } from '../models/job.ts';
import { createApplicationRecord } from '../models/application.ts';

export async function seedInitialData(locals: any) {
  const { jobRepository, applicationRepository, profileRepository, userRepository } = locals;

  const existingJobs = await jobRepository.findMany();
  if (existingJobs.length > 0) return; // already seeded

  // Ensure default mock user exists
  await userRepository.upsert({ key: 'test-user', email: 'creator@example.com', profileType: 'creator' });
  await profileRepository.upsert('test-user', {
    type: 'creator',
    name: 'Test Creator',
    bio: 'Just a mock creator profile.',
  });

  const jobsToSeed = [
    // Fashion (2)
    { title: 'Fashion Week Coverage Promo', brand_name: 'VogueApparel', target_platform: 'instagram', post_type: 'video', total_budget: 1200 },
    { title: 'Summer Fashion Lookbook', brand_name: 'TrendyStyle', target_platform: 'tiktok', post_type: 'video', total_budget: 800 },
    
    // Tech Startup (3)
    { title: 'Tech Startup Explainer Video', brand_name: 'InnovateTech', target_platform: 'youtube', post_type: 'video', total_budget: 2000 },
    { title: 'Beta Tester & Reviewer for Tech Startup', brand_name: 'CodeBuilders', target_platform: 'twitter', post_type: 'content_writing', total_budget: 500 },
    { title: 'Tech Startup Launch Campaign', brand_name: 'NextGenApps', target_platform: 'instagram', post_type: 'image', total_budget: 1500 },

    // E-commerce (4)
    { title: 'E-commerce Product Photography', brand_name: 'ShopGlobal', target_platform: 'instagram', post_type: 'image', total_budget: 600 },
    { title: 'Holiday Sale Promo for E-commerce', brand_name: 'DealMart', target_platform: 'twitter', post_type: 'content_writing', total_budget: 300 },
    { title: 'E-commerce Store Walkthrough', brand_name: 'BuyItNow', target_platform: 'youtube', post_type: 'video', total_budget: 1500 },
    { title: 'E-commerce Affiliate Push', brand_name: 'SellQuick', target_platform: 'tiktok', post_type: 'video', total_budget: 900 },

    // SaaS (2)
    { title: 'SaaS B2B Tutorial Series', brand_name: 'CloudSync', target_platform: 'youtube', post_type: 'video', total_budget: 2500 },
    { title: 'SaaS Platform Review Thread', brand_name: 'DataFlow', target_platform: 'twitter', post_type: 'content_writing', total_budget: 400 },

    // Content Writing (3)
    { title: 'SEO Content Writing for Tech Blog', brand_name: 'BlogMaster', target_platform: 'other', post_type: 'content_writing', total_budget: 350 },
    { title: 'Newsletter Content Writing', brand_name: 'NewsWeekly', target_platform: 'other', post_type: 'content_writing', total_budget: 200 },
    { title: 'Whitepaper Content Writing', brand_name: 'CryptoDocs', target_platform: 'other', post_type: 'content_writing', total_budget: 800 },

    // Video Editing (4)
    { title: 'YouTube Vlog Video Editing', brand_name: 'CreatorStudio', target_platform: 'youtube', post_type: 'video', total_budget: 500 },
    { title: 'TikTok Shorts Video Editing', brand_name: 'ShortsFactory', target_platform: 'tiktok', post_type: 'video', total_budget: 300 },
    { title: 'Documentary Style Video Editing', brand_name: 'DocuFilm', target_platform: 'youtube', post_type: 'video', total_budget: 1200 },
    { title: 'Real Estate Video Editing', brand_name: 'HomeVision', target_platform: 'instagram', post_type: 'video', total_budget: 400 },

    // UGC Creator (2)
    { title: 'Skincare UGC Creator Needed', brand_name: 'GlowSkin', target_platform: 'tiktok', post_type: 'video', total_budget: 600 },
    { title: 'Fitness App UGC Creator', brand_name: 'FitTrack', target_platform: 'instagram', post_type: 'video', total_budget: 700 },

    // Brand Ambassador (3)
    { title: 'Long-term Brand Ambassador', brand_name: 'FitLife', target_platform: 'instagram', post_type: 'image', total_budget: 2000 },
    { title: 'Energy Drink Brand Ambassador', brand_name: 'PowerUp', target_platform: 'tiktok', post_type: 'video', total_budget: 1500 },
    { title: 'Gaming Headset Brand Ambassador', brand_name: 'GamerPro', target_platform: 'youtube', post_type: 'video', total_budget: 3000 },
  ];

  for (let i = 0; i < jobsToSeed.length; i++) {
    const j = jobsToSeed[i];
    await jobRepository.create({
      title: j.title,
      organization_id: `org-${j.brand_name.toLowerCase().replace(/\s+/g, '-')}`,
      organization: { brand_name: j.brand_name },
      description: `Looking for experienced creators for: ${j.title}. We are excited to collaborate with someone passionate about our brand!`,
      target_platform: j.target_platform as any,
      post_type: j.post_type as any,
      payout_type: i % 2 === 0 ? 'full' : 'milestone',
      total_budget: j.total_budget,
      status: 'open',
    });
  }

  // 1 Active Deal (Job + Accepted Application)
  const activeJob = await jobRepository.create({
    title: 'Ongoing Brand Ambassador - Q3',
    organization_id: 'org-adidas',
    organization: { brand_name: 'Adidas' },
    description: 'Monthly Instagram posts wearing our new summer collection.',
    target_platform: 'instagram',
    post_type: 'image',
    payout_type: 'milestone',
    total_budget: 5000,
    status: 'in_progress', // Active deals are "in_progress" in the backend
  });

  const application = await applicationRepository.create({
    job_id: activeJob.id,
    creator_id: 'test-user', // Current user's ID
    cover_note: 'I love Adidas and have a highly engaged fitness audience!',
  });
  await applicationRepository.update(application.id, { status: 'accepted' });

  // Keep a reference
  activeJob.selected_creator_id = 'test-user';
  await jobRepository.update(activeJob.id, { selected_creator_id: 'test-user' });
}

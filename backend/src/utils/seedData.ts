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

  // 4 Open Opportunities
  await jobRepository.create({
    title: 'Instagram Reel for New Sneaker Launch',
    organization_id: 'org-nike',
    organization: { brand_name: 'Nike' },
    description: 'We need a 30-second high-energy Instagram reel showcasing our new AirMax series.',
    target_platform: 'instagram',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 1500,
    status: 'open',
  });

  await jobRepository.create({
    title: 'YouTube Tech Review: SuperHeadphones Pro',
    organization_id: 'org-sony',
    organization: { brand_name: 'Sony' },
    description: 'Looking for a detailed unboxing and review of our latest noise-canceling headphones.',
    target_platform: 'youtube',
    post_type: 'video',
    payout_type: 'milestone',
    total_budget: 3500,
    status: 'open',
  });

  await jobRepository.create({
    title: 'Twitter Thread on Web3 Payments',
    organization_id: 'org-flux',
    organization: { brand_name: 'Flux Protocol' },
    description: 'Write an engaging 10-tweet thread explaining the benefits of crypto escrow for freelancers.',
    target_platform: 'twitter',
    post_type: 'content_writing',
    payout_type: 'full',
    total_budget: 500,
    status: 'open',
  });

  await jobRepository.create({
    title: 'TikTok Viral Challenge Dance',
    organization_id: 'org-redbull',
    organization: { brand_name: 'Red Bull' },
    description: 'Participate in the #GivesYouWings dance challenge using our official sound.',
    target_platform: 'tiktok',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 1200,
    status: 'open',
  });

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

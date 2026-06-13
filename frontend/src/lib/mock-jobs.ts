// Canonical frontend fallback deals — used when the API is empty/unauthorized.
// Mirrors the backend seed shape (category, skills, milestones, funding_status)
// so the UI looks the same whether data comes from the API or this fallback.
// Exported as EXTRA_MOCK_JOBS (back-compat) and MOCK_DEALS.

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

export interface MockMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'disputed';
}

export interface MockDeal {
  id: string;
  title: string;
  organization: { brand_name: string; bio?: string; website?: string; reputation?: number; logo_url?: string };
  description: string;
  category: string;
  skills: string[];
  target_platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'other';
  post_type: 'video' | 'image' | 'content_writing' | 'other';
  payout_type: 'milestone' | 'full';
  total_budget: number;
  status: 'open' | 'in_progress' | 'completed';
  funding_status: 'unfunded' | 'funded' | 'partially_released' | 'released';
  milestones: MockMilestone[];
  required_elements: { hashtags: string[]; mentions: string[] };
  created_at: string;
  deadline: string;
}

const ms = (id: string, list: Array<[string, string, number, MockMilestone['status']?]>): MockMilestone[] =>
  list.map(([title, description, amount, status], i) => ({ id: `${id}-m${i + 1}`, title, description, amount, status: status ?? 'pending' }));

const logo = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const EXTRA_MOCK_JOBS: MockDeal[] = [
  {
    id: 'job-5', title: 'Twitch Stream Sponsorship — Apex Legends', category: 'Gaming',
    organization: { brand_name: 'Logitech G', bio: 'Play to win.', website: 'https://logitechg.com', reputation: 4.9, logo_url: logo('logitechg.com') },
    description: 'Showcase our G Pro Wireless mouse during a 2-hour Apex Legends stream with authentic gameplay.',
    skills: ['Live streaming', 'Commentary', 'Gaming'],
    target_platform: 'other', post_type: 'video', payout_type: 'milestone', total_budget: 2000, status: 'open', funding_status: 'funded',
    milestones: ms('job-5', [['Confirm stream slot', 'Schedule the 2h stream', 400], ['Go live', 'Stream with product visible', 1000], ['Clip + recap post', 'Share highlight clip', 600]]),
    required_elements: { hashtags: ['LogitechG', 'PlayToWin'], mentions: ['@LogitechG'] }, created_at: hoursAgo(2), deadline: inDays(5),
  },
  {
    id: 'job-6', title: 'Instagram Carousel — Summer Wardrobe', category: 'Fashion',
    organization: { brand_name: 'Zara', bio: 'Latest trends in fashion.', website: 'https://zara.com', reputation: 4.6, logo_url: logo('zara.com') },
    description: 'Create a 5-slide carousel featuring our new summer collection. Clothing provided.',
    skills: ['Photography', 'Styling', 'Copywriting'],
    target_platform: 'instagram', post_type: 'image', payout_type: 'milestone', total_budget: 800, status: 'in_progress', funding_status: 'partially_released',
    milestones: ms('job-6', [['Style 3 looks', 'Confirm outfits', 200, 'approved'], ['Shoot carousel', 'Submit 5 frames', 300, 'submitted'], ['Publish', 'Post with tags', 300]]),
    required_elements: { hashtags: ['ZaraSummer', 'OOTD'], mentions: ['@Zara'] }, created_at: hoursAgo(5), deadline: inDays(7),
  },
  {
    id: 'job-7', title: 'YouTube Tutorial — Intro to Web3', category: 'Crypto',
    organization: { brand_name: 'Coinbase', bio: 'The easiest place to buy and sell crypto.', website: 'https://coinbase.com', reputation: 4.8, logo_url: logo('coinbase.com') },
    description: 'A 15-minute beginner-friendly tutorial on setting up a Web3 wallet and making a first transaction.',
    skills: ['Tutorial creation', 'Scriptwriting', 'Voiceover'],
    target_platform: 'youtube', post_type: 'video', payout_type: 'milestone', total_budget: 4500, status: 'open', funding_status: 'funded',
    milestones: ms('job-7', [['Script approval', 'Beginner-friendly script', 700], ['Record + edit', 'Submit draft', 1800], ['Publish', 'Public video with chapters', 2000]]),
    required_elements: { hashtags: ['Web3', 'Crypto'], mentions: ['@Coinbase'] }, created_at: hoursAgo(12), deadline: inDays(14),
  },
  {
    id: 'job-8', title: 'TikTok Recipe — Healthy Snacks', category: 'Food',
    organization: { brand_name: 'Whole Foods', bio: 'Quality natural and organic products.', website: 'https://wholefoodsmarket.com', reputation: 4.7, logo_url: logo('wholefoodsmarket.com') },
    description: 'A quick, under-60s healthy snack recipe using ingredients from Whole Foods.',
    skills: ['Short-form video', 'Food styling'],
    target_platform: 'tiktok', post_type: 'video', payout_type: 'full', total_budget: 900, status: 'open', funding_status: 'unfunded',
    milestones: ms('job-8', [['Film + publish recipe', 'Under-60s clip', 900]]),
    required_elements: { hashtags: ['HealthySnacks', 'WholeFoods'], mentions: ['@WholeFoods'] }, created_at: hoursAgo(24), deadline: inDays(6),
  },
  {
    id: 'job-9', title: 'Twitter Giveaway Campaign', category: 'Crypto',
    organization: { brand_name: 'Ledger', bio: 'Secure your crypto.', website: 'https://ledger.com', reputation: 4.9, logo_url: logo('ledger.com') },
    description: 'Host a giveaway for a Ledger Nano X. Prize and copy provided.',
    skills: ['Thread writing', 'Community management'],
    target_platform: 'twitter', post_type: 'content_writing', payout_type: 'full', total_budget: 600, status: 'completed', funding_status: 'released',
    milestones: ms('job-9', [['Launch giveaway', 'Post + pin', 300, 'approved'], ['Announce winner', 'Close + report', 300, 'approved']]),
    required_elements: { hashtags: ['CryptoSecurity', 'Giveaway'], mentions: ['@Ledger'] }, created_at: hoursAgo(48), deadline: inDays(2),
  },
  {
    id: 'job-10', title: 'Instagram Story Takeover', category: 'Music',
    organization: { brand_name: 'Spotify', bio: 'Listening is everything.', website: 'https://spotify.com', reputation: 4.8, logo_url: logo('spotify.com') },
    description: 'Take over our IG for a day sharing summer playlists and music discovery tips.',
    skills: ['Short-form video', 'Storytelling'],
    target_platform: 'instagram', post_type: 'video', payout_type: 'milestone', total_budget: 2500, status: 'open', funding_status: 'funded',
    milestones: ms('job-10', [['Plan the takeover', 'Outline 6 frames', 500], ['Go live', 'Publish stories', 2000]]),
    required_elements: { hashtags: ['SpotifyTakeover', 'SummerHits'], mentions: ['@Spotify'] }, created_at: hoursAgo(72), deadline: inDays(10),
  },
  {
    id: 'job-11', title: 'YouTube Gameplay Walkthrough', category: 'Gaming',
    organization: { brand_name: 'Epic Games', bio: 'Creators of Fortnite and Unreal Engine.', website: 'https://epicgames.com', reputation: 4.5, logo_url: logo('epicgames.com') },
    description: 'A 20-minute gameplay video for the new Fortnite season highlighting map changes.',
    skills: ['Video editing', 'Commentary', 'Gaming'],
    target_platform: 'youtube', post_type: 'video', payout_type: 'milestone', total_budget: 3500, status: 'in_progress', funding_status: 'funded',
    milestones: ms('job-11', [['Capture footage', 'Record session', 700, 'approved'], ['Edit', 'Submit cut', 1800, 'submitted'], ['Publish', 'Upload + thumbnail', 1000]]),
    required_elements: { hashtags: ['Fortnite', 'EpicGames'], mentions: ['@EpicGames'] }, created_at: hoursAgo(10), deadline: inDays(8),
  },
  {
    id: 'job-12', title: 'TikTok Fitness Transformation', category: 'Fitness',
    organization: { brand_name: 'Gymshark', bio: 'Be a visionary.', website: 'https://gymshark.com', reputation: 4.7, logo_url: logo('gymshark.com') },
    description: 'A TikTok showing a 30-day transformation or daily routine in our seamless collection.',
    skills: ['Short-form video', 'Fitness coaching'],
    target_platform: 'tiktok', post_type: 'video', payout_type: 'milestone', total_budget: 1500, status: 'open', funding_status: 'funded',
    milestones: ms('job-12', [['Plan content', 'Confirm routine', 300], ['Film series', 'Edit clips', 700], ['Publish', 'Post + tag', 500]]),
    required_elements: { hashtags: ['Gymshark', 'FitnessJourney'], mentions: ['@Gymshark'] }, created_at: hoursAgo(30), deadline: inDays(20),
  },
  {
    id: 'job-13', title: 'Twitter Space Co-Host — DeFi', category: 'Crypto',
    organization: { brand_name: 'Binance', bio: 'Exchange the world.', website: 'https://binance.com', reputation: 4.8, logo_url: logo('binance.com') },
    description: 'Co-host an official Binance Space on the future of DeFi and Web3 payments.',
    skills: ['Public speaking', 'Moderation'],
    target_platform: 'twitter', post_type: 'other', payout_type: 'full', total_budget: 1800, status: 'open', funding_status: 'funded',
    milestones: ms('job-13', [['Prep', 'Share talking points', 400], ['Host the Space', '60-min session', 1400]]),
    required_elements: { hashtags: ['BinanceSpace', 'DeFi'], mentions: ['@Binance'] }, created_at: hoursAgo(15), deadline: inDays(5),
  },
  {
    id: 'job-14', title: 'Instagram Product Photography', category: 'Tech',
    organization: { brand_name: 'Apple', bio: 'Think different.', website: 'https://apple.com', reputation: 5.0, logo_url: logo('apple.com') },
    description: 'Aesthetic lifestyle shots of the new AirPods Max for your feed.',
    skills: ['Photography', 'Product styling'],
    target_platform: 'instagram', post_type: 'image', payout_type: 'milestone', total_budget: 4000, status: 'open', funding_status: 'funded',
    milestones: ms('job-14', [['Concept', 'Approve look', 800], ['Shoot', 'Submit gallery', 1700], ['Publish', 'Post + caption', 1500]]),
    required_elements: { hashtags: ['ShotOniPhone', 'AirPodsMax'], mentions: ['@Apple'] }, created_at: hoursAgo(3), deadline: inDays(12),
  },
  {
    id: 'job-15', title: 'YouTube Short — Glow Skincare Routine', category: 'Beauty',
    organization: { brand_name: 'Sephora', bio: 'Beauty, your way.', website: 'https://sephora.com', reputation: 4.7, logo_url: logo('sephora.com') },
    description: 'A 60-second Short featuring a morning skincare routine with our new serum.',
    skills: ['Tutorial creation', 'Lighting'],
    target_platform: 'youtube', post_type: 'video', payout_type: 'full', total_budget: 1300, status: 'open', funding_status: 'unfunded',
    milestones: ms('job-15', [['Film + publish Short', 'With description link', 1300]]),
    required_elements: { hashtags: ['Sephora', 'SkincareRoutine'], mentions: ['@Sephora'] }, created_at: hoursAgo(6), deadline: inDays(15),
  },
  {
    id: 'job-16', title: 'Explainer — Smart Budgeting for Gen Z', category: 'Finance',
    organization: { brand_name: 'Revolut', bio: 'One app, all things money.', website: 'https://revolut.com', reputation: 4.6, logo_url: logo('revolut.com') },
    description: 'A short, animated explainer on budgeting and saving for a Gen Z audience.',
    skills: ['Scriptwriting', 'Motion graphics'],
    target_platform: 'youtube', post_type: 'video', payout_type: 'milestone', total_budget: 2200, status: 'in_progress', funding_status: 'partially_released',
    milestones: ms('job-16', [['Script', 'Approve', 400, 'approved'], ['Animate', 'Submit draft', 900, 'submitted'], ['Publish', 'Public video', 900]]),
    required_elements: { hashtags: ['Revolut', 'MoneyTips'], mentions: ['@Revolut'] }, created_at: hoursAgo(20), deadline: inDays(17),
  },
  {
    id: 'job-17', title: 'Vlog — 48 Hours City Guide', category: 'Travel',
    organization: { brand_name: 'Airbnb', bio: 'Belong anywhere.', website: 'https://airbnb.com', reputation: 4.8, logo_url: logo('airbnb.com') },
    description: 'A travel vlog featuring a 48-hour city guide staying at an Airbnb.',
    skills: ['Vlogging', 'Video editing', 'Drone'],
    target_platform: 'youtube', post_type: 'video', payout_type: 'milestone', total_budget: 2800, status: 'open', funding_status: 'funded',
    milestones: ms('job-17', [['Shot list', 'Approve locations', 500], ['Film', 'Submit footage', 1300], ['Publish', 'Upload final cut', 1000]]),
    required_elements: { hashtags: ['Airbnb', 'CityGuide'], mentions: ['@Airbnb'] }, created_at: hoursAgo(8), deadline: inDays(22),
  },
];

// Alias for clarity at call sites that want the full list of deals.
export const MOCK_DEALS = EXTRA_MOCK_JOBS;

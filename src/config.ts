import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: required('GUILD_ID'),

  roles: {
    verified: required('VERIFIED_ROLE_ID'),
    blacklist: required('BLACKLIST_ROLE_ID'),
    mod: required('MOD_ROLE_ID'),
  },

  channels: {
    review: required('REVIEW_CHANNEL_ID'),
    appealReview: required('APPEAL_REVIEW_CHANNEL_ID'),
  },

  questionCategoryId: required('QUESTION_CATEGORY_ID'),
};

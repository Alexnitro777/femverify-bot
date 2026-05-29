import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  Client,
  Collection,
} from 'discord.js';

export interface SlashCommand {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ButtonHandler {
  customId: string | RegExp;
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

export interface ModalHandler {
  customId: string | RegExp;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, SlashCommand>;
  buttons: Collection<string, ButtonHandler>;
  modals: Collection<string, ModalHandler>;
}

export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blacklisted';

export type AppealStatus = 'pending' | 'amnestied' | 'denied';

export interface Application {
  userId: string;
  username: string;
  guildId: string;
  answers: Record<string, string>;
  submittedAt: number;
  status: ApplicationStatus;
  reviewMessageUrl?: string;
  reviewerId?: string;
  reason?: string;
  questionChannelId?: string;
}

export interface Appeal {
  userId: string;
  username: string;
  text: string;
  submittedAt: number;
  status: AppealStatus;
  reviewerId?: string;
  reason?: string;
}

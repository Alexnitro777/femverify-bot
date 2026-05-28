import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  GuildMember,
} from 'discord.js';
import { ButtonHandler } from '../types';
import { appealQuestions } from '../questions';
import { config } from '../config';
import { getAppeal } from '../storage';

const handler: ButtonHandler = {
  customId: 'appeal:start',

  async execute(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as GuildMember | null;
    if (!member || !member.roles.cache.has(config.roles.blacklist)) {
      await interaction.reply({
        content: 'Аппеляция доступна только участникам в чёрном списке.',
        ephemeral: true,
      });
      return;
    }

    const existing = getAppeal(interaction.user.id);
    if (existing?.status === 'pending') {
      await interaction.reply({ content: 'Ваша аппеляция уже на рассмотрении.', ephemeral: true });
      return;
    }

    const modal = new ModalBuilder().setCustomId('appeal:submit').setTitle('Форма аппеляции');
    const rows = appealQuestions.slice(0, 5).map((q) => {
      const input = new TextInputBuilder()
        .setCustomId(q.id)
        .setLabel(q.label)
        .setStyle(q.style)
        .setRequired(q.required);
      if (q.minLength) input.setMinLength(q.minLength);
      if (q.maxLength) input.setMaxLength(q.maxLength);
      if (q.placeholder) input.setPlaceholder(q.placeholder);
      return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    });
    modal.addComponents(...rows);
    await interaction.showModal(modal);
  },
};

export default handler;

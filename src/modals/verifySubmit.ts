import { ModalSubmitInteraction, TextChannel } from 'discord.js';
import { ModalHandler } from '../types';
import { verifyQuestions } from '../questions';
import { saveApplication } from '../storage';
import { config } from '../config';
import { buildApplicationEmbed, buildReviewButtons } from '../ui';

const handler: ModalHandler = {
  customId: 'verify:submit',

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    const answers: Record<string, string> = {};
    for (const q of verifyQuestions.slice(0, 5)) {
      try {
        answers[q.id] = interaction.fields.getTextInputValue(q.id);
      } catch {
        answers[q.id] = '';
      }
    }

    const embed = buildApplicationEmbed(interaction.user, answers);
    const buttons = buildReviewButtons(interaction.user.id);

    const channel = await interaction.client.channels.fetch(config.channels.review);
    let reviewMessageUrl: string | undefined;
    if (channel && channel.isTextBased()) {
      const msg = await (channel as TextChannel).send({ embeds: [embed], components: [buttons] });
      reviewMessageUrl = msg.url;
    }

    saveApplication({
      userId: interaction.user.id,
      username: interaction.user.tag,
      guildId: interaction.guildId ?? '',
      answers,
      submittedAt: Date.now(),
      status: 'pending',
      reviewMessageUrl,
    });

    await interaction.reply({
      content: '✅ Анкета отправлена. Ожидайте решения модерации.',
      ephemeral: true,
    });
  },
};

export default handler;

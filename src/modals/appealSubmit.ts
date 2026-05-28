import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { ModalHandler } from '../types';
import { appealQuestions } from '../questions';
import { saveAppeal } from '../storage';
import { config } from '../config';

const handler: ModalHandler = {
  customId: 'appeal:submit',

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    const answers: Record<string, string> = {};
    for (const q of appealQuestions.slice(0, 5)) {
      try {
        answers[q.id] = interaction.fields.getTextInputValue(q.id);
      } catch {
        answers[q.id] = '';
      }
    }

    const text = appealQuestions
      .slice(0, 5)
      .map((q) => `**${q.label}**\n${(answers[q.id] ?? '').trim() || '—'}`)
      .join('\n\n');

    saveAppeal({
      userId: interaction.user.id,
      username: interaction.user.tag,
      text,
      submittedAt: Date.now(),
      status: 'pending',
    });

    const embed = new EmbedBuilder()
      .setTitle('Новая аппеляция')
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(text.length > 4000 ? text.slice(0, 3997) + '...' : text)
      .setColor(0xeb459e)
      .setFooter({ text: `ID: ${interaction.user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`appeal:amnesty:${interaction.user.id}`)
        .setLabel('Принять амнистию')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`appeal:deny:${interaction.user.id}`)
        .setLabel('Отказать в амнистии')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    );

    const channel = await interaction.client.channels.fetch(config.channels.appealReview);
    if (channel?.isTextBased()) {
      await (channel as TextChannel).send({ embeds: [embed], components: [row] });
    }

    await interaction.reply({
      content: '✅ Аппеляция отправлена. Ожидайте решения модерации.',
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default handler;

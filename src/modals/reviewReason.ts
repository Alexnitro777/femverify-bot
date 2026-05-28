import { ModalSubmitInteraction, EmbedBuilder, TextChannel, MessageFlags } from 'discord.js';
import { ModalHandler } from '../types';
import { config } from '../config';
import { getApplication, updateApplication } from '../storage';
import { buildResolvedEmbed, buildDmEmbed } from '../ui';

// review:reason:<reject|blacklist>:<userId>
const handler: ModalHandler = {
  customId: /^review:reason:(reject|blacklist):\d+$/,

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    const [, , action, userId] = interaction.customId.split(':');
    const reason = interaction.fields.getTextInputValue('reason').trim();

    const app = getApplication(userId);
    if (!app) {
      await interaction.reply({ content: 'Заявка не найдена.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (app.status !== 'pending') {
      await interaction.reply({ content: `Заявка уже обработана (${app.status}).`, flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild!;
    const member = await guild.members.fetch(userId).catch(() => null);

    if (action === 'blacklist') {
      await member?.roles.add(config.roles.blacklist).catch(() => null);
      updateApplication(userId, { status: 'blacklisted', reviewerId: interaction.user.id, reason });
      await member
        ?.send({
          embeds: [
            buildDmEmbed(
              '🚫 Вы добавлены в чёрный список',
              `Причина: ${reason}\n\nВы можете подать аппеляцию в соответствующем канале.`,
              0x992d22,
            ),
          ],
        })
        .catch(() => null);
    } else {
      updateApplication(userId, { status: 'rejected', reviewerId: interaction.user.id, reason });
      await member
        ?.send({
          embeds: [
            buildDmEmbed(
              '❌ Заявка отклонена',
              `Причина: ${reason}\n\nВы можете подать новую заявку.`,
              0xed4245,
            ),
          ],
        })
        .catch(() => null);
    }

    // Обновляем исходное сообщение заявки в канале модерации
    if (app.reviewMessageUrl) {
      const reviewChannel = await interaction.client.channels.fetch(config.channels.review).catch(() => null);
      if (reviewChannel?.isTextBased()) {
        const messageId = app.reviewMessageUrl.split('/').pop()!;
        const msg = await (reviewChannel as TextChannel).messages.fetch(messageId).catch(() => null);
        if (msg && msg.embeds[0]) {
          const resolved = buildResolvedEmbed(
            EmbedBuilder.from(msg.embeds[0]),
            action === 'blacklist' ? 'ЧС' : 'Отклонено',
            action === 'blacklist' ? 0x992d22 : 0xed4245,
            interaction.user.id,
            reason,
          );
          await msg.edit({ embeds: [resolved], components: [] }).catch(() => null);
        }
      }
    }

    await interaction.reply({
      content: action === 'blacklist' ? 'Участник добавлен в ЧС.' : 'Заявка отклонена.',
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default handler;

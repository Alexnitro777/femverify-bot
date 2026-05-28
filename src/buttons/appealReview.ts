import {
  ButtonInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { ButtonHandler } from '../types';
import { config } from '../config';
import { getAppeal, updateAppeal } from '../storage';
import { buildResolvedEmbed, buildDmEmbed } from '../ui';

function isMod(interaction: ButtonInteraction): boolean {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return (
    member.permissions.has(PermissionFlagsBits.ManageRoles) ||
    member.roles.cache.has(config.roles.mod)
  );
}

// appeal:<amnesty|deny>:<userId>
const handler: ButtonHandler = {
  customId: /^appeal:(amnesty|deny):\d+$/,

  async execute(interaction: ButtonInteraction): Promise<void> {
    if (!isMod(interaction)) {
      await interaction.reply({ content: 'Недостаточно прав.', flags: MessageFlags.Ephemeral });
      return;
    }

    const [, action, userId] = interaction.customId.split(':');
    const appeal = getAppeal(userId);
    if (!appeal) {
      await interaction.reply({ content: 'Аппеляция не найдена.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (appeal.status !== 'pending') {
      await interaction.reply({ content: `Аппеляция уже обработана (${appeal.status}).`, flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild!;
    const member = await guild.members.fetch(userId).catch(() => null);

    if (action === 'amnesty') {
      // Снимаем только роль ЧС
      await member?.roles.remove(config.roles.blacklist).catch(() => null);
      updateAppeal(userId, { status: 'amnestied', reviewerId: interaction.user.id });
      await member
        ?.send({
          embeds: [
            buildDmEmbed(
              '✅ Амнистия принята',
              'С вас снят чёрный список. Вы можете снова пройти верификацию.',
              0x57f287,
            ),
          ],
        })
        .catch(() => null);
    } else {
      updateAppeal(userId, { status: 'denied', reviewerId: interaction.user.id });
      await member
        ?.send({
          embeds: [
            buildDmEmbed('❌ В амнистии отказано', 'Ваша аппеляция отклонена. ЧС сохраняется.', 0xed4245),
          ],
        })
        .catch(() => null);
    }

    const resolved = buildResolvedEmbed(
      EmbedBuilder.from(interaction.message.embeds[0]),
      action === 'amnesty' ? 'Амнистия принята' : 'В амнистии отказано',
      action === 'amnesty' ? 0x57f287 : 0xed4245,
      interaction.user.id,
    );
    await interaction.update({ embeds: [resolved], components: [] });
  },
};

export default handler;

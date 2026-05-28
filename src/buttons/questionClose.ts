import { ButtonInteraction, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { ButtonHandler } from '../types';
import { config } from '../config';

// question:close:<channelId>
const handler: ButtonHandler = {
  customId: /^question:close:\d+$/,

  async execute(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as GuildMember | null;
    const allowed =
      member &&
      (member.permissions.has(PermissionFlagsBits.ManageChannels) ||
        member.roles.cache.has(config.roles.mod));
    if (!allowed) {
      await interaction.reply({ content: 'Недостаточно прав.', flags: MessageFlags.Ephemeral });
      return;
    }

    const [, , channelId] = interaction.customId.split(':');
    await interaction.reply({ content: 'Канал будет удалён через 5 секунд...', flags: MessageFlags.Ephemeral });

    const channel = await interaction.guild?.channels.fetch(channelId).catch(() => null);
    setTimeout(() => {
      channel?.delete().catch(() => null);
    }, 5000);
  },
};

export default handler;

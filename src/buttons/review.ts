import {
  ButtonInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { ButtonHandler } from '../types';
import { config } from '../config';
import { getApplication, updateApplication } from '../storage';
import { buildResolvedEmbed, buildDmEmbed } from '../ui';

function isMod(interaction: ButtonInteraction): boolean {
  if (!interaction.inGuild()) return false;
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return (
    member.permissions.has(PermissionFlagsBits.ManageRoles) ||
    member.roles.cache.has(config.roles.mod)
  );
}

// review:<action>:<userId>
const handler: ButtonHandler = {
  customId: /^review:(approve|reject|question|blacklist):\d+$/,

  async execute(interaction: ButtonInteraction): Promise<void> {
    if (!isMod(interaction)) {
      await interaction.reply({ content: 'Недостаточно прав.', flags: MessageFlags.Ephemeral });
      return;
    }

    const [, action, userId] = interaction.customId.split(':');
    const app = getApplication(userId);
    if (!app) {
      await interaction.reply({ content: 'Заявка не найдена.', flags: MessageFlags.Ephemeral });
      return;
    }

    // reject / blacklist требуют причину -> открываем модалку
    if (action === 'reject' || action === 'blacklist') {
      if (app.status !== 'pending') {
        await interaction.reply({ content: `Заявка уже обработана (${app.status}).`, flags: MessageFlags.Ephemeral });
        return;
      }
      const modal = new ModalBuilder()
        .setCustomId(`review:reason:${action}:${userId}`)
        .setTitle(action === 'reject' ? 'Причина отказа' : 'Причина ЧС');
      const input = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Укажите причину')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    // question -> создаём приватный канал, не меняя статус заявки
    if (action === 'question') {
      const guild = interaction.guild!;
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Пользователь покинул сервер.', flags: MessageFlags.Ephemeral });
        return;
      }

      const channel = await guild.channels.create({
        name: `вопрос-${member.user.username}`.slice(0, 90),
        type: ChannelType.GuildText,
        parent: config.questionCategoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: userId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: config.roles.mod,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle('Уточнение по заявке')
        .setDescription(
          `<@${userId}>, у модерации появился вопрос по вашей анкете.\n` +
            'Ответьте здесь. Кнопки ниже — для модерации.',
        )
        .setColor(0x5865f2);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Открыть анкету')
          .setStyle(ButtonStyle.Link)
          .setURL(app.reviewMessageUrl ?? interaction.message.url),
        new ButtonBuilder()
          .setCustomId(`question:close:${channel.id}`)
          .setLabel('Закрыть канал')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
      );

      const pingMsg = await channel.send({
        content: `<@${userId}> <@${interaction.user.id}>`,
        allowedMentions: { users: [userId, interaction.user.id] },
      });
      await channel.send({ embeds: [embed], components: [row] });
      await pingMsg.delete().catch(() => null);
      await interaction.reply({ content: `Канал создан: <#${channel.id}>`, flags: MessageFlags.Ephemeral });
      return;
    }

    // approve
    if (app.status !== 'pending') {
      await interaction.reply({ content: `Заявка уже обработана (${app.status}).`, flags: MessageFlags.Ephemeral });
      return;
    }
    const guild = interaction.guild!;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      await interaction.reply({ content: 'Пользователь покинул сервер.', flags: MessageFlags.Ephemeral });
      return;
    }
    await member.roles.add(config.roles.verified).catch(() => null);
    updateApplication(userId, { status: 'approved', reviewerId: interaction.user.id });

    await member
      .send({
        embeds: [buildDmEmbed('✅ Заявка одобрена', 'Добро пожаловать на сервер!', 0x57f287)],
      })
      .catch(() => null);

    const resolved = buildResolvedEmbed(
      EmbedBuilder.from(interaction.message.embeds[0]),
      'Принято',
      0x57f287,
      interaction.user.id,
    );
    await interaction.update({ embeds: [resolved], components: [] });
  },
};

export default handler;

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('appeal')
    .setDescription('Разместить сообщение с кнопкой аппеляции в текущем канале')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as unknown as SlashCommand['data'],

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'Команду нужно запускать в текстовом канале.', flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚖️ Аппеляция')
      .setDescription(
        'Если вы попали в чёрный список и считаете это ошибкой — нажмите кнопку ниже ' +
          'и заполните форму аппеляции.\n\nМодерация рассмотрит вашу просьбу об амнистии.',
      )
      .setColor(0xeb459e);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('appeal:start')
        .setLabel('Подать аппеляцию')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📨'),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Сообщение аппеляции размещено.', flags: MessageFlags.Ephemeral });
  },
};

export default command;

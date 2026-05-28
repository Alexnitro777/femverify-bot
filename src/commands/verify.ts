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
    .setName('verify')
    .setDescription('Разместить сообщение с кнопкой верификации в текущем канале')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as unknown as SlashCommand['data'],

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'Команду нужно запускать в текстовом канале.', flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔒 Верификация')
      .setDescription(
        'Чтобы получить доступ к серверу, нажмите кнопку ниже и заполните анкету.\n\n' +
          'После отправки модерация рассмотрит вашу заявку.',
      )
      .setColor(0x5865f2);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('verify:start')
        .setLabel('Пройти верификацию')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝'),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Сообщение верификации размещено.', flags: MessageFlags.Ephemeral });
  },
};

export default command;

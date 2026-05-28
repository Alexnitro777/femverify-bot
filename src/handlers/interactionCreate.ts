import { Interaction } from 'discord.js';
import { BotClient } from '../types';

export async function handleInteraction(client: BotClient, interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      for (const handler of client.buttons.values()) {
        const match =
          handler.customId instanceof RegExp
            ? handler.customId.test(interaction.customId)
            : handler.customId === interaction.customId;
        if (match) {
          await handler.execute(interaction);
          return;
        }
      }
    }

    if (interaction.isModalSubmit()) {
      for (const handler of client.modals.values()) {
        const match =
          handler.customId instanceof RegExp
            ? handler.customId.test(interaction.customId)
            : handler.customId === interaction.customId;
        if (match) {
          await handler.execute(interaction);
          return;
        }
      }
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: 'Произошла ошибка при обработке.', ephemeral: true })
        .catch(() => null);
    }
  }
}

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config';
import { BotClient } from './types';
import { loadCommands, loadButtons, loadModals } from './handlers/loader';
import { handleInteraction } from './handlers/interactionCreate';

async function bootstrap(): Promise<void> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.GuildMember],
  }) as BotClient;

  client.commands = new Collection();
  client.buttons = new Collection();
  client.modals = new Collection();

  await loadCommands(client);
  await loadButtons(client);
  await loadModals(client);

  client.once('ready', (c) => {
    console.log(`Logged in as ${c.user.tag}`);
  });

  client.on('interactionCreate', (interaction) => handleInteraction(client, interaction));

  await client.login(config.token);
}

bootstrap().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

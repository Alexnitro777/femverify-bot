import { REST, Routes } from 'discord.js';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from './config';
import { SlashCommand } from './types';

async function main(): Promise<void> {
  const commandsDir = path.join(__dirname, 'commands');
  const files = (await fs.readdir(commandsDir)).filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts'),
  );

  const body = [];
  for (const f of files) {
    const mod = await import(path.join(commandsDir, f));
    const cmd: SlashCommand = mod.default;
    body.push(cmd.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(config.token);
  console.log(`Deploying ${body.length} command(s) to guild ${config.guildId}...`);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

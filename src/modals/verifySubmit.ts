import { ModalSubmitInteraction, TextChannel, MessageFlags } from 'discord.js';
import { ModalHandler } from '../types';
import { verifyQuestions } from '../questions';
import { saveApplication } from '../storage';
import { config } from '../config';
import { buildApplicationEmbed, buildReviewButtons } from '../ui';

const handler: ModalHandler = {
  customId: 'verify:submit',

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    const answers: Record<string, string> = {};
    for (const q of verifyQuestions.slice(0, 5)) {
      try {
        answers[q.id] = interaction.fields.getTextInputValue(q.id);
      } catch {
        answers[q.id] = '';
      }
    }

    // Валидация ответов до отправки в модерацию (баг #7).
    const age = Number(answers.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      await interaction.reply({
        content: 'Возраст указан некорректно — введите число от 1 до 120.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const rulesAnswer = (answers.rules ?? '').trim().toLowerCase();
    const positive = ['да', 'yes', 'д', 'y', '+'];
    if (!positive.includes(rulesAnswer)) {
      await interaction.reply({
        content: 'Подтвердите, что прочитали правила, ответив «да» в соответствующем поле.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Долгая часть — деферим, чтобы уложиться в окно ответа Discord (баг #1).
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const embed = buildApplicationEmbed(interaction.user, answers);
    const buttons = buildReviewButtons(interaction.user.id);

    const channel = await interaction.client.channels.fetch(config.channels.review).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      // Канал модерации недоступен — не сохраняем заявку, иначе она зависнет
      // в pending без сообщения, которое модерация может увидеть (баг #4).
      console.error('[verifySubmit] review channel unavailable:', config.channels.review);
      await interaction.editReply({
        content: '❌ Не удалось отправить заявку: канал модерации недоступен. Сообщите администрации.',
      });
      return;
    }

    const msg = await (channel as TextChannel)
      .send({ embeds: [embed], components: [buttons] })
      .catch((e) => {
        console.error('[verifySubmit] failed to post review message:', e);
        return null;
      });

    if (!msg) {
      await interaction.editReply({
        content: '❌ Не удалось отправить заявку модерации. Попробуйте позже или сообщите администрации.',
      });
      return;
    }

    saveApplication({
      userId: interaction.user.id,
      username: interaction.user.tag,
      guildId: interaction.guildId ?? '',
      answers,
      submittedAt: Date.now(),
      status: 'pending',
      reviewMessageUrl: msg.url,
    });

    await interaction.editReply({
      content: '✅ Анкета отправлена. Ожидайте решения модерации.',
    });
  },
};

export default handler;

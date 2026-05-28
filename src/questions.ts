import { TextInputStyle } from 'discord.js';

export interface Question {
  id: string;
  label: string;
  style: TextInputStyle;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}

// Discord modal limit: максимум 5 полей на одно модальное окно.

// Вопросы анкеты верификации
export const verifyQuestions: Question[] = [
  {
    id: 'age',
    label: 'Сколько вам лет?',
    style: TextInputStyle.Short,
    required: true,
    minLength: 1,
    maxLength: 3,
    placeholder: 'Например: 18',
  },
  {
    id: 'source',
    label: 'Откуда вы узнали о сервере?',
    style: TextInputStyle.Short,
    required: true,
    maxLength: 200,
  },
  {
    id: 'about',
    label: 'Расскажите немного о себе',
    style: TextInputStyle.Paragraph,
    required: true,
    minLength: 20,
    maxLength: 1000,
  },
  {
    id: 'rules',
    label: 'Прочитали ли вы правила? (да/нет)',
    style: TextInputStyle.Short,
    required: true,
    maxLength: 10,
  },
  {
    id: 'goals',
    label: 'Что вы ждёте от сервера?',
    style: TextInputStyle.Paragraph,
    required: false,
    maxLength: 500,
  },
];

// Вопросы формы аппеляции
export const appealQuestions: Question[] = [
  {
    id: 'reason',
    label: 'Почему вас занесли в ЧС?',
    style: TextInputStyle.Paragraph,
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  {
    id: 'argument',
    label: 'Почему вас стоит амнистировать?',
    style: TextInputStyle.Paragraph,
    required: true,
    minLength: 20,
    maxLength: 1000,
  },
];

export interface ForumComment {
  id: number;
  plaintext: string;
  /** id модератора, оставившего комментарий */
  author: number;
  /** id игрока, к профилю которого прикреплён комментарий */
  user: number;
  created: string;
}

export interface ForumPost {
  id: number;
  plaintext: string;
  /** Исходная разметка поста; null, если БД заполнена до появления колонки */
  html: string | null;
  /** null, если в дампе не нашлось даты редактирования */
  created: string | null;
  usersInText: number[];
  linksInText: string[];
}

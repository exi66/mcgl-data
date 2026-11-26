# mcgl-data

Поиск по архиву форума [Minecraft Galaxy](https://minecraft-galaxy.ru/): комментарии модераторов к профилям и посты.
Данные отдаёт [mcgl-data-api](https://github.com/exi66/mcgl-data-api). Сайт: https://exi66.github.io/mcgl-data/

## Поиск

- поиск по словоформам, `"точная фраза"`, `шахта or руда`, `-исключение`;
- ключи: комментарии — `id:775`, `author:1,2`, `user:41234`; посты — `id:113294`, `usersInText:1,12120`,
  `linksInText:http://vk.com/x`; везде `after:2016-01-31`, `before:2017-01-01`.

Запрос сохраняется в адресе страницы (`?tab=posts&q=…`), ссылкой на поиск можно поделиться.

## Разработка

Сделан на [exi66/starter](https://github.com/exi66/starter): Vite, React, TypeScript, Tailwind, shadcn. Нужны
Node.js 22+ и pnpm. Адреса API — в `.env.local` (не коммитится):

```sh
VITE_API_URL=<адрес PostgREST>
VITE_FORUM_PROXY_URL=<CORS-прокси для тултипов форума, необязательно>
```

```sh
pnpm install
pnpm dev          # дев-сервер
pnpm test         # тесты
pnpm lint         # oxlint
pnpm format       # prettier
pnpm typecheck    # tsc
pnpm build        # сборка в dist/
```

CI запускается на пуши и PR в `main`. Публикация на GitHub Pages — по тегу: `git tag vX.Y.Z && git push --tags`
(адреса API берутся из секретов репозитория `VITE_API_URL` и `VITE_FORUM_PROXY_URL`).

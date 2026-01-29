
# Инструкция по деплою AdsInsight

## 1. Хостинг (Frontend)
Рекомендуем использовать **Vercel** или **Netlify**.
1. Создайте аккаунт на [vercel.com](https://vercel.com).
2. Загрузите файлы проекта.
3. Получите URL (например, `https://my-ads-dash.vercel.app`). **Важно: только HTTPS!**

## 2. Настройка Facebook (Meta for Developers)
Чтобы авторизация работала на вашем хостинге:
1. Зайдите в [Meta for Developers](https://developers.facebook.com/).
2. В настройках приложения (**Settings > Basic**) добавьте ваш домен в поле **App Domains**.
3. В разделе **Facebook Login > Settings** добавьте ваш домен в **Valid OAuth Redirect URIs**.
4. Убедитесь, что приложение переведено в режим **Live**.
5. Скопируйте **App ID** и вставьте его в `index.html`.

## 3. Бесплатная База Данных (Supabase)
Мы используем Supabase (бесплатный уровень до 500MB).
1. Создайте проект на [supabase.com](https://supabase.com).
2. Создайте таблицу `ad_insights` со следующими полями:
   - `id` (text, primary key)
   - `date` (date)
   - `spend` (float8)
   - `clicks` (int8)
   - `impressions` (int8)
   - `leads` (int8)
   - `messaging` (int8)
   - `conversions` (int8)
   - `revenue` (float8)
   - `target_id` (text)
3. Скопируйте `Project URL` и `Anon Key` в `supabaseService.ts`.

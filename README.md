
# Парсер интернет магазина komus.ru

Этот парсер не для публичного доступа, поэтому для его работы необходимы Firebase Cloud Messaging токены. Которые генерируются отдельным скриптом.

В данном репозитории вы найдете только код по которому можно оценить мою работу. И краткую историю о том как этот код был написан.

🌐 Сайт любезно предоставляет [Sitemap](https://www.komus.ru/sitemap.xml), где есть ссылки на все товары товары, например, такие как эта: [komus.ru/katalog/mebel/mebel- ... buk-730kh730kh22-mm-/p/110829/](https://www.komus.ru/katalog/mebel/mebel-dlya-personala/pristavki-k-stolu/pristavki/pristavka-argo-a-020-bez-opory-buk-730kh730kh22-mm-/p/110829/)

🤖 Оказалось, что большая часть URL адреса не имеет значения, кроме /p/110829/ Вероятно 110829 это ID товара в базе данных. Эта информация пригодится в будущем.

📱 Но как быть, если обойти Qrator в короткий срок я не могу? Решение пришло с использованием мобильного приложения. Я воспользовался инструментом для обратной инженерии и начал анализировать трафик.

🤯 Авторизация в Firebase, анонимная авторизация на сервере komus через OAuth, а далее запросы 
 со всеми необходимыми данными подписанные токеном OAuth. Без какой либо защиты. Но здесь возникают сложности. Для успешной авторизации нужно передать "device_id", который состоит из FirebaseID и некой шифрованной части, а также добавить заголовок "X-Komus-Mobileapp". Алгоритм формирования "X-Komus-Mobileapp" мне удалось раскрыть, но "device_id" оставался загадкой.

🔍 Я провел долгие исследования, но так и не смог найти место в котором генерируется нужная мне строка. Окончательно запутавшись в Smali коде связанном с RxJava я написал скрипт на Node.js, который сбрасывает данные приложения, устанавливает прокси и через Frida получает сгенерированный "device_id", после чего завершает процесс приложения, до обращения к серверам komus. Вот у меня и появились ценные "device_id", связанные с прокси.

🌟 API предоставил интересный мне endpoint: /komuswebservices/v1/komus/product/?code=*16 id товаров через запятую*. Я предположил, что в URL товара содержится ID, и моя догадка подтвердилась. Теперь осталось делать запросы с токеном OAuth к этой конечной точке и получить все необходимые данные в удобном формате JSON. И, конечно, важно не перегрузить сервер.

# Backendi valik

Valisin custom backendi jaoks Node.js + Express raamistikuga serveri ja SQLite andmebaasi. Projekti olemasolev osa oli juba Vite/JavaScript põhine, seega jääb kogu tööriistakomplekt ühte keelde ja seda on lihtne Windowsis või kooli arvutis käivitada. Express sobib hästi väikese restorani lehe jaoks: marsruudid on selged, EJS mallidega saab III mooduli staatilised HTML-vaated muuta backendi vaadeteks ning admini vormid saab kiiresti lisada ilma keerulise frontend-raamistikuta.

SQLite eelis on lihtne paigaldus. Eraldi andmebaasiserverit ei ole vaja ning migratsioon loob kogu struktuuri ühte faili. Samal ajal kasutatakse päringutes `better-sqlite3` ettevalmistatud lauseid, seega ei panda kasutaja sisendit otse SQL stringidesse. Admini paroolid räsitakse `bcryptjs` abil ning sessiooni saladus, admini algparool ja andmebaasi tee tulevad `.env` failist.

Miinuseks on see, et SQLite ei ole suurte mitme serveriga rakenduste jaoks parim valik. Kui restoranile tekiks palju samaaegseid kirjutusi või oleks vaja pilves mitut rakendusserverit, oleks PostgreSQL parem. Express annab ka palju vastutust arendajale: CSRF-kaitse, serveripoolne valideerimine, sessiooni seaded ja vigade käsitlus tuleb ise korrektselt lisada. Selle projekti mahu juures on see siiski mõistlik kompromiss, sest lahendus jääb arusaadav, väike ja kontrollitav.

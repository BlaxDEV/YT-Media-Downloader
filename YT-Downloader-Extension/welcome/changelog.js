/*
 * Changelog Page Script - YT Media Downloader Extension v1.3.0
 * Multi-language support & language switcher
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  const translations = {
    en: {
      title: "YT Media Downloader — Release v1.3.0",
      subtitle: "What's new in v1.3.0 across the Extension and Companion Server.",
      extTitle: "PO-Token Anti-Bot & Playlist Engine",
      extItem1T: "PO-Token Auto-Injection:",
      extItem1D: "Automatically captures live session PO-Tokens and forwards them to the backend to bypass YouTube anti-bot limits.",
      extItem2T: "Playlist Queue & Rate Throttling:",
      extItem2D: "Processes video batches sequentially with smart sleep intervals to prevent HTTP 429 rate limit bans.",
      extItem3T: "Companion Server Version Check:",
      extItem3D: "Extension pings companion status and displays a clear warning if the server installer is older than v1.3.0.",
      extItem4T: "YouTube Shorts & Modal Upgrades:",
      extItem4D: "Maintains full Shorts action bar integration and draggable screen clamping.",
      srvTitle: "Companion Server & Engine (v1.3.0)",
      srvSubtitle: "Companion Server v1.3.0 Update Required!",
      srvItem1T: "PO-Token Parameter Support:",
      srvItem1D: "Ingests PO-Tokens and passes --extractor-args youtube:po_token=web+... to yt-dlp.",
      srvItem2T: "100% English Installer & Dialogs:",
      srvItem2D: "All maintenance wizard dialogs and native folder picker titles are standardized in English.",
      srvItem3T: "Zero-Disk Cookie & Token Security:",
      srvItem3D: "Processes session cookies and tokens exclusively in RAM with 0-byte disk footprint.",
      srvItem4T: "Engine & Dependency Alignment:",
      srvItem4D: "Guarantees smooth 1080p, 4K, 60fps and audio processing across Windows & Linux.",
      ctaTitle: "💖 Support the project or leave a review!",
      ctaDesc: "If you find this app helpful, a review on the Mozilla Add-ons store is immensely appreciated to gain visibility, or consider buying me a Ko-Fi!",
      ctaKofi: "☕ Buy me a Ko-Fi!",
      ctaGithub: "⭐ View on GitHub",
      ctaReview: "⭐ Rate on Firefox Add-ons"
    },
    es: {
      title: "YT Media Downloader — Versión v1.3.0",
      subtitle: "Novedades de la versión v1.3.0 en la Extensión y el Servidor Companion.",
      extTitle: "Motor Anti-Bot PO-Token y Colas de Playlist",
      extItem1T: "Auto-Inyección de PO-Token:",
      extItem1D: "Captura automáticamente el PO-Token de la sesión y lo envía al servidor para evitar bloqueos de YouTube.",
      extItem2T: "Cola de Lista de Reproducción y Control de Cadencia:",
      extItem2D: "Procesa lotes de videos de forma secuencial con pausas inteligentes para prevenir el error HTTP 429.",
      extItem3T: "Verificación de Versión del Companion:",
      extItem3D: "La extensión verifica el estado del servidor y muestra una alerta si el Companion instalado es menor a v1.3.0.",
      extItem4T: "Mejoras en YouTube Shorts y Ventana Modal:",
      extItem4D: "Mantiene la integración nativa en la barra de acciones de Shorts y memoria de posición.",
      srvTitle: "Servidor Companion y Motor (v1.3.0)",
      srvSubtitle: "¡Se requiere actualizar a Companion Server v1.3.0!",
      srvItem1T: "Soporte de Parámetros PO-Token:",
      srvItem1D: "Recibe el PO-Token y envía --extractor-args youtube:po_token=web+... a yt-dlp.",
      srvItem2T: "Instalador y Diálogos 100% en Inglés:",
      srvItem2D: "Todos los menús del asistente e interfaces nativas estandarizados en idioma inglés.",
      srvItem3T: "Seguridad Cero-Disco para Cookies y Tokens:",
      srvItem3D: "Procesa cookies y tokens de sesión exclusivamente en memoria RAM sin dejar rastro en disco.",
      srvItem4T: "Alineación de Motor y Dependencias:",
      srvItem4D: "Garantiza descargas fluidas en 1080p, 4K, 60fps y audio en Windows y Linux.",
      ctaTitle: "💖 ¡Apoya el proyecto o deja una valoración!",
      ctaDesc: "Si disfrutas de la extensión, agradecería muchísimo tu calificación en la tienda de Mozilla Add-ons para tener más visibilidad, ¡o invítame un cafecito en Ko-Fi!",
      ctaKofi: "☕ ¡Buy me a Ko-Fi!",
      ctaGithub: "⭐ Ver en GitHub",
      ctaReview: "⭐ Calificar en Mozilla Add-ons"
    },
    pt: {
      title: "YT Media Downloader — Versão v1.2.9",
      subtitle: "Novidades da versão v1.2.9 na Extensão e no Servidor Companion.",
      extTitle: "Melhorias no YouTube Shorts e Janela Modal",
      extItem1T: "Posição do Botão no Shorts:",
      extItem1D: "O botão de download agora fica logo acima do botão de Curtir (coração) no YouTube Shorts.",
      extItem2T: "Abertura da Janela no Shorts:",
      extItem2D: "A janela de download abre diretamente ao lado da barra de ações do Shorts.",
      extItem3T: "Memória de Posição e Limite de Tela:",
      extItem3D: "Lembra onde você arrastou a janela e impede que ela saia da área visível da tela.",
      extItem4T: "Layout de Tela Única:",
      extItem4D: "Layout otimizado para caber em uma única tela sem necessidade de rolar.",
      srvTitle: "Servidor Companion e Motor (v1.2.9)",
      srvSubtitle: "Sem alterações no Companion, v1.2.8 estável e funcional",
      srvItem1T: "Segurança de Cookies Zero-Disco:",
      srvItem1D: "Processa cookies exclusivamente na RAM com limpeza instantânea.",
      srvItem2T: "Seletor Nativo de Pastas:",
      srvItem2D: "Abre a janela nativa do sistema lembrando a última pasta selecionada.",
      srvItem3T: "Limpeza Automática de Cookies:",
      srvItem3D: "Remove automaticamente arquivos antigos de cookies ao iniciar o servidor.",
      srvItem4T: "Motor yt-dlp Atualizado:",
      srvItem4D: "Garante downloads fluidos em 1080p, 4K, 60fps e áudio.",
      ctaTitle: "💖 Apoie o projeto ou deixe uma avaliação!",
      ctaDesc: "Se você gosta da extensão, uma avaliação na loja do Mozilla Add-ons ajuda muito na visibilidade, ou pague-me um café no Ko-Fi!",
      ctaKofi: "☕ Pague-me um Ko-Fi!",
      ctaGithub: "⭐ Ver no GitHub",
      ctaReview: "⭐ Avaliar no Mozilla Add-ons"
    },
    fr: {
      title: "YT Media Downloader — Version v1.3.0",
      subtitle: "Nouveautés de la version v1.3.0 sur l'extension et le serveur Companion.",
      extTitle: "Moteur Anti-Bot PO-Token & Gestion des Playlists",
      extItem1T: "Auto-Injection de PO-Token:",
      extItem1D: "Capture automatiquement le PO-Token de session pour contourner les limites anti-bot de YouTube.",
      extItem2T: "File de Playlist & Débit Régulé:",
      extItem2D: "Traite les lots de vidéos séquentiellement avec des pauses intelligentes pour éviter les erreurs HTTP 429.",
      extItem3T: "Vérification de Version du Serveur:",
      extItem3D: "Affiche un avertissement clair si le serveur Companion installé est inférieur à la version v1.3.0.",
      extItem4T: "Améliorations Shorts & Fenêtre:",
      extItem4D: "Conserve l'intégration idéale dans YouTube Shorts et le blocage aux limites de l'écran.",
      srvTitle: "Serveur Companion & Moteur (v1.3.0)",
      srvSubtitle: "Mise à Jour vers Companion Server v1.3.0 Requise!",
      srvItem1T: "Prise en Charge des Paramètres PO-Token:",
      srvItem1D: "Transmet le PO-Token directement à yt-dlp via --extractor-args youtube:po_token=web+...",
      srvItem2T: "Assistant d'Installation 100% Anglais:",
      srvItem2D: "Tous les menus et boîtes de dialogue système sont désormais standardisés en anglais.",
      srvItem3T: "Sécurité Cookies & Tokens Zéro-Disque:",
      srvItem3D: "Traite les cookies et jetons en RAM sans aucune écriture sur le disque dur.",
      srvItem4T: "Alignement des Dépendances Moteur:",
      srvItem4D: "Assure des téléchargements fluides en 1080p, 4K, 60fps et audio sous Windows et Linux.",
      ctaTitle: "💖 Soutenez le projet ou laissez un avis !",
      ctaDesc: "Si vous appréciez l'extension, un avis sur Mozilla Add-ons nous aide énormément à gagner en visibilité, ou offrez-moi un café sur Ko-Fi !",
      ctaKofi: "☕ Offrez-moi un Ko-Fi !",
      ctaGithub: "⭐ Voir sur GitHub",
      ctaReview: "⭐ Évaluer sur Mozilla Add-ons"
    },
    de: {
      title: "YT Media Downloader — Version v1.3.0",
      subtitle: "Neuerungen in v1.3.0 für Erweiterung und Companion-Server.",
      extTitle: "PO-Token Anti-Bot & Playlist Warteschlange",
      extItem1T: "PO-Token Auto-Injektion:",
      extItem1D: "Erfasst automatisch Session-PO-Tokens und leitet sie an das Backend weiter, um Anti-Bot-Sperren zu umgehen.",
      extItem2T: "Playlist-Warteschlange & Ratenbegrenzung:",
      extItem2D: "Verarbeitet Videos nacheinander mit klugen Pausen, um HTTP 429 Sperren zu verhindern.",
      extItem3T: "Companion-Server Versionsprüfung:",
      extItem3D: "Zeigt eine Warnung an, falls der installierte Companion-Server älter als v1.3.0 ist.",
      extItem4T: "Shorts & Modal Upgrades:",
      extItem4D: "Behält die nahtlose Shorts-Integration und Fensterbegrenzung bei.",
      srvTitle: "Companion-Server & Engine (v1.3.0)",
      srvSubtitle: "Aktualisierung auf Companion Server v1.3.0 erforderlich!",
      srvItem1T: "PO-Token Parameter-Unterstützung:",
      srvItem1D: "Übergibt den PO-Token direkt an yt-dlp via --extractor-args youtube:po_token=web+...",
      srvItem2T: "100% Englischer Installer & Dialoge:",
      srvItem2D: "Alle Installationsassistenten-Dialoge und Ordnerauswähler sind auf Englisch standardisiert.",
      srvItem3T: "Zero-Disk Cookie & Token Sicherheit:",
      srvItem3D: "Verarbeitet Cookies und Tokens ausschließlich im RAM ohne Festplattenspuren.",
      srvItem4T: "Engine & Abhängigkeiten Aktualisiert:",
      srvItem4D: "Garantiert reibungslose Downloads in 1080p, 4K, 60fps und Audio unter Windows & Linux.",
      ctaTitle: "💖 Unterstütze das Projekt oder hinterlasse eine Bewertung!",
      ctaDesc: "Wenn dir die Erweiterung gefällt, hilft eine Bewertung im Mozilla Add-ons Store enorm für mehr Sichtbarkeit, oder spendiere mir einen Kaffee auf Ko-Fi!",
      ctaKofi: "☕ Kaufe mir einen Ko-Fi!",
      ctaGithub: "⭐ Auf GitHub ansehen",
      ctaReview: "⭐ Auf Mozilla Add-ons bewerten"
    },
    it: {
      title: "YT Media Downloader — Versione v1.3.0",
      subtitle: "Novità della versione v1.3.0 per l'Estensione e il Server Companion.",
      extTitle: "Motore Anti-Bot PO-Token e Code di Playlist",
      extItem1T: "Iniezione Automatica PO-Token:",
      extItem1D: "Cattura automaticamente il PO-Token della sessione ed evita i blocchi anti-bot di YouTube.",
      extItem2T: "Coda di Playlist e Controllo Frequenza:",
      extItem2D: "Elabora i video in sequenza con pause intelligenti per evitare l'errore HTTP 429.",
      extItem3T: "Controllo Versione del Companion:",
      extItem3D: "Mostra un avviso se il server Companion installato è inferiore alla versione v1.3.0.",
      extItem4T: "Miglioramenti Shorts e Finestra Modale:",
      extItem4D: "Mantiene l'integrazione nativa in YouTube Shorts e i limiti di trascinamento schermo.",
      srvTitle: "Server Companion & Engine (v1.3.0)",
      srvSubtitle: "Aggiornamento a Companion Server v1.3.0 Richiesto!",
      srvItem1T: "Supporto Parametro PO-Token:",
      srvItem1D: "Invia --extractor-args youtube:po_token=web+... direttamente a yt-dlp.",
      srvItem2T: "Installatore e Finestre 100% in Inglese:",
      srvItem2D: "Tutte le schermate della procedura di installazione standardizzate in lingua inglese.",
      srvItem3T: "Sicurezza Zero-Disco per Cookie e Token:",
      srvItem3D: "Elabora cookie e token esclusivamente in memoria RAM senza salvare su disco.",
      srvItem4T: "Motore yt-dlp Aggiornato:",
      srvItem4D: "Garantisce download fluidi in 1080p, 4K, 60fps ed estrazione audio.",
      ctaTitle: "💖 Supporta il progetto o lascia una recensione!",
      ctaDesc: "Se trovi utile l'estensione, una recensione nello store Mozilla Add-ons ci aiuta molto per la visibilità, oppure offrimi un caffè su Ko-Fi!",
      ctaKofi: "☕ Offrimi un Ko-Fi!",
      ctaGithub: "⭐ Vedi su GitHub",
      ctaReview: "⭐ Valuta su Mozilla Add-ons"
    },
    ru: {
      title: "YT Media Downloader — Релиз v1.3.0",
      subtitle: "Что нового в v1.3.0 в Расширении и Сервере Companion.",
      extTitle: "Anti-Bot Движок PO-Token и Очередь Плейлистов",
      extItem1T: "Авто-Внедрение PO-Token:",
      extItem1D: "Автоматически перехватывает PO-Token сессии и передает его на сервер для обхода блокировок.",
      extItem2T: "Очередь Плейлиста и Задержка:",
      extItem2D: "Последовательно скачивает видео с умными паузами для предотвращения ошибки HTTP 429.",
      extItem3T: "Проверка Версии Companion Server:",
      extItem3D: "Выводит предупреждение, если установленный Companion Server ниже версии v1.3.0.",
      extItem4T: "Улучшения Shorts и Модального Окна:",
      extItem4D: "Сохраняет полную интеграцию с YouTube Shorts и ограничение перемещения по экрану.",
      srvTitle: "Companion Server & Движок (v1.3.0)",
      srvSubtitle: "Требуется обновление Companion Server v1.3.0!",
      srvItem1T: "Поддержка Параметров PO-Token:",
      srvItem1D: "Принимает PO-Token и передает --extractor-args youtube:po_token=web+... в yt-dlp.",
      srvItem2T: "Установщик 100% на Английском:",
      srvItem2D: "Все диалоги мастера установки и выбора папок стандартизированы на английском.",
      srvItem3T: "Безопасность Без Диска в ОЗУ:",
      srvItem3D: "Обрабатывает cookies и токены исключительно в ОЗУ без записи на диск.",
      srvItem4T: "Обновленный Движок yt-dlp:",
      srvItem4D: "Обеспечивает стабильную загрузку в 1080p, 4K, 60fps и аудио.",
      ctaTitle: "💖 Поддержите проект или оставьте отзыв!",
      ctaDesc: "Если вам нравится расширение, отзыв в магазине Mozilla Add-ons очень поможет в продвижении, или угостите меня кофе на Ko-Fi!",
      ctaKofi: "☕ Купить мне Ko-Fi!",
      ctaGithub: "⭐ Смотреть на GitHub",
      ctaReview: "⭐ Оценить на Mozilla Add-ons"
    },
    ja: {
      title: "YT Media Downloader — リリース v1.3.0",
      subtitle: "拡張機能およびCompanionサーバーのv1.3.0の新機能。",
      extTitle: "PO-Token Anti-Bot & プレイリストエンジン",
      extItem1T: "PO-Token自動挿入:",
      extItem1D: "ライブセッションのPO-Tokenを自動キャプチャし、YouTubeのAnti-Bot制限を回避します。",
      extItem2T: "プレイリストキュー & レート制御:",
      extItem2D: "スマートな遅延を挿入して連続ダウンロードを行い、HTTP 429エラーを防止します。",
      extItem3T: "Companionサーバーのバージョン確認:",
      extItem3D: "Companionサーバーがv1.3.0未満の場合、明確な更新警告を表示します。",
      extItem4T: "YouTube Shorts & モーダルウィンドウの改善:",
      extItem4D: "Shortsアクションバーへの完全統合と画面内ドラッグ制限を維持します。",
      srvTitle: "Companion サーバー & エンジン (v1.3.0)",
      srvSubtitle: "Companion Server v1.3.0 への更新が必要です！",
      srvItem1T: "PO-Tokenパラメータのサポート:",
      srvItem1D: "PO-Tokenを受け取り、--extractor-args youtube:po_token=web+... をyt-dlpに渡します。",
      srvItem2T: "完全英語対応のインストーラー:",
      srvItem2D: "すべてのセットアップ画面およびフォルダ選択ダイアログが英語に統一されました。",
      srvItem3T: "メモリ内処理による完全なセキュリティ:",
      srvItem3D: "クッキーおよびトークンをRAMのみで処理し、ディスクに一切保存しません。",
      srvItem4T: "yt-dlpエンジンの最適化:",
      srvItem4D: "1080p、4K、60fpsおよび音声処理の安定動作を保証します。",
      ctaTitle: "💖 プロジェクトの応援・レビューをお願いします！",
      ctaDesc: "拡張機能が役に立った場合は、Mozilla Add-onsストアでの評価やKo-Fiでのご支援をいただけると大変励みになります！",
      ctaKofi: "☕ Ko-Fiで応援する！",
      ctaGithub: "⭐ GitHubで見る",
      ctaReview: "⭐ Mozilla Add-onsで評価する"
    },
    zh: {
      title: "YT Media Downloader — 发布版本 v1.3.0",
      subtitle: "扩展程序与 Companion 服务端 v1.3.0 更新说明。",
      extTitle: "PO-Token Anti-Bot 与播放列表队列引擎",
      extItem1T: "PO-Token 自动注入:",
      extItem1D: "自动捕获实时会话 PO-Token 并转发至服务端，有效绕过 YouTube 防刷限流。",
      extItem2T: "播放列表队列与平滑限速:",
      extItem2D: "采用智能间隔按顺序下载视频批次，彻底避免 HTTP 429 频控封禁。",
      extItem3T: "Companion 服务端版本检测:",
      extItem3D: "扩展将自动检测 Companion 版本，若低于 v1.3.0 将弹出更新提示。",
      extItem4T: "YouTube Shorts 与弹窗功能优化:",
      extItem4D: "保持与 Shorts 操作栏的无缝集成及屏幕可视区域边界拖拽限制。",
      srvTitle: "Companion 服务端与引擎 (v1.3.0)",
      srvSubtitle: "需要更新至 Companion Server v1.3.0！",
      srvItem1T: "PO-Token 参数支持:",
      srvItem1D: "接收 PO-Token 并将 --extractor-args youtube:po_token=web+... 传给 yt-dlp。",
      srvItem2T: "100% 纯英文安装程序与对话框:",
      srvItem2D: "安装向导与原生文件夹选择器标题已全部标准化为英文。",
      srvItem3T: "零磁盘 Cookie 与 Token 安全:",
      srvItem3D: "Cookie 与 Token 仅在内存中处理，随用随擦，零磁盘残留。",
      srvItem4T: "更新 yt-dlp 引擎依赖:",
      srvItem4D: "保障 Windows 与 Linux 平台下 1080p、4K、60fps 及音频的高效稳定。",
      ctaTitle: "💖 支持项目或留下评价！",
      ctaDesc: "如果您喜欢这款扩展，欢迎在 Mozilla Add-ons 商店留下评价帮助我们获得更多曝光，或者在 Ko-Fi 上请我喝杯咖啡！",
      ctaKofi: "☕ 在 Ko-Fi 请我喝咖啡！",
      ctaGithub: "⭐ 在 GitHub 上查看",
      ctaReview: "⭐ 在 Mozilla Add-ons 评价"
    }
  };

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;

    const setTxt = (id, text) => {
      const element = document.getElementById(id);
      if (element) {
        const span = element.querySelector("span");
        if (span) span.textContent = text;
        else element.textContent = text;
      }
    };

    setTxt("cl-title", dict.title);
    setTxt("cl-subtitle", dict.subtitle);
    setTxt("cl-srv-title", dict.srvTitle);
    setTxt("cl-srv-subtitle", dict.srvSubtitle);
    setTxt("cl-srv-item1-t", dict.srvItem1T);
    setTxt("cl-srv-item1-d", dict.srvItem1D);
    setTxt("cl-srv-item2-t", dict.srvItem2T);
    setTxt("cl-srv-item2-d", dict.srvItem2D);
    setTxt("cl-srv-item3-t", dict.srvItem3T);
    setTxt("cl-srv-item3-d", dict.srvItem3D);
    setTxt("cl-srv-item4-t", dict.srvItem4T);
    setTxt("cl-srv-item4-d", dict.srvItem4D);

    setTxt("cl-ext-title", dict.extTitle);
    setTxt("cl-ext-item1-t", dict.extItem1T);
    setTxt("cl-ext-item1-d", dict.extItem1D);
    setTxt("cl-ext-item2-t", dict.extItem2T);
    setTxt("cl-ext-item2-d", dict.extItem2D);
    setTxt("cl-ext-item3-t", dict.extItem3T);
    setTxt("cl-ext-item3-d", dict.extItem3D);
    setTxt("cl-ext-item4-t", dict.extItem4T);
    setTxt("cl-ext-item4-d", dict.extItem4D);

    setTxt("cl-cta-title", dict.ctaTitle);
    setTxt("cl-cta-desc", dict.ctaDesc);
    setTxt("cl-cta-kofi", dict.ctaKofi);
    setTxt("cl-cta-github", dict.ctaGithub);
    setTxt("cl-cta-review", dict.ctaReview);
  }

  storage.local.get("settings", (res) => {
    const savedLang = res?.settings?.defLang || "en";
    if (langSelect) langSelect.value = savedLang;
    applyTranslations(savedLang);
  });

  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      applyTranslations(selectedLang);
      storage.local.get("settings", (res) => {
        const current = res?.settings || {};
        storage.local.set({ settings: { ...current, defLang: selectedLang } });
      });
    });
  }
});

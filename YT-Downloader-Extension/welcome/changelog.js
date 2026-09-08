/*
 * Changelog Page Script - YT Media Downloader Extension v1.3.1
 * Multi-language support & language switcher
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  const translations = {
    en: {
      title: "YT Media Downloader — Release v1.3.1",
      subtitle: "What's new in v1.3.1: YouTube parameter updates, JavaScript challenge solving, and audio fix.",
      extTitle: "Core Stability & Engine v1.3.1",
      extItem1T: "YouTube Parameter & Stream Alignment:",
      extItem1D: "Updated YouTube extraction parameters to bypass anti-bot and HTTP 403 Forbidden stream blocks.",
      extItem2T: "Audio & Video Extraction Fix:",
      extItem2D: "Enforces dedicated bestaudio stream selection for lossless MP3, M4A, Opus, and FLAC downloads.",
      extItem3T: "Companion Server Version Check:",
      extItem3D: "Extension pings companion status and displays an update prompt if the server is older than v1.3.1.",
      extItem4T: "Enhanced Diagnostics:",
      extItem4D: "Provides real-time error messages and detailed feedback directly in the download panel and history.",
      srvTitle: "Companion Server & Engine (v1.3.1)",
      srvSubtitle: "Companion Server v1.3.1 Update Required!",
      srvItem1T: "JavaScript n-Challenge Solver Engine:",
      srvItem1D: "Automatically detects system JS runtimes (Node.js, Deno, QuickJS) and passes --js-runtimes to solve YouTube challenges.",
      srvItem2T: "Multi-Browser Cookie Detection:",
      srvItem2D: "Auto-detects session cookies from Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave, and Opera.",
      srvItem3T: "Zero-Disk Cookie & Token Security:",
      srvItem3D: "Processes session cookies and tokens exclusively in RAM with 0-byte disk footprint.",
      srvItem4T: "Engine & Dependency Alignment:",
      srvItem4D: "Guarantees smooth 1080p, 4K, 60fps, Shorts, and audio processing across Windows & Linux.",
      ctaTitle: "💖 Support the project or leave a review!",
      ctaDesc: "If you find this app helpful, a review on the Mozilla Add-ons store is immensely appreciated to gain visibility, or consider buying me a Ko-Fi!",
      ctaKofi: "☕ Buy me a Ko-Fi!",
      ctaGithub: "⭐ View on GitHub",
      ctaReview: "⭐ Rate on Firefox Add-ons"
    },
    es: {
      title: "YT Media Downloader — Versión v1.3.1",
      subtitle: "Novedades de la versión v1.3.1: Actualización de parámetros de YouTube, resolución de desafíos JS y corrección en audio.",
      extTitle: "Estabilidad del Motor y Parámetros v1.3.1",
      extItem1T: "Alineación de Parámetros de YouTube:",
      extItem1D: "Actualización de parámetros de extracción de YouTube para evitar bloqueos anti-bot y errores HTTP 403 Forbidden.",
      extItem2T: "Corrección en Descargas de Audio y Video:",
      extItem2D: "Asigna flujos dedicados de audio para descargas impecables en MP3, M4A, Opus y FLAC sin interrupciones.",
      extItem3T: "Verificación de Versión del Companion:",
      extItem3D: "La extensión comprueba el estado del servidor y muestra un aviso si el Companion instalado es anterior a v1.3.1.",
      extItem4T: "Diagnósticos y Registro Mejorados:",
      extItem4D: "Muestra detalles y causas exactas en caso de fallo directamente en la interfaz y en el historial.",
      srvTitle: "Servidor Companion y Motor (v1.3.1)",
      srvSubtitle: "¡Se requiere actualizar a Companion Server v1.3.1!",
      srvItem1T: "Motor de Resolución JS (n-challenge):",
      srvItem1D: "Detecta automáticamente entornos de JavaScript (Node.js, Deno, QuickJS) y envía --js-runtimes para superar los retos de YouTube.",
      srvItem2T: "Detección Automática de Cookies Multi-Navegador:",
      srvItem2D: "Reconoce perfiles y cookies de Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave y Opera.",
      srvItem3T: "Seguridad Cero-Disco para Cookies y Tokens:",
      srvItem3D: "Procesa cookies y tokens de sesión exclusivamente en memoria RAM sin dejar rastro en disco.",
      srvItem4T: "Alineación de Motor y Dependencias:",
      srvItem4D: "Garantiza descargas fluidas en 1080p, 4K, 60fps, Shorts y audio en Windows y Linux.",
      ctaTitle: "💖 ¡Apoya el proyecto o deja una valoración!",
      ctaDesc: "Si disfrutas de la extensión, agradecería muchísimo tu calificación en la tienda de Mozilla Add-ons para tener más visibilidad, ¡o invítame un cafecito en Ko-Fi!",
      ctaKofi: "☕ ¡Buy me a Ko-Fi!",
      ctaGithub: "⭐ Ver en GitHub",
      ctaReview: "⭐ Calificar en Mozilla Add-ons"
    },
    pt: {
      title: "YT Media Downloader — Versão v1.3.1",
      subtitle: "Novidades da versão v1.3.1: Atualização dos parâmetros do YouTube, resolução de desafios JS e correção de áudio.",
      extTitle: "Estabilidade do Motor e Parâmetros v1.3.1",
      extItem1T: "Alinhamento com Parâmetros do YouTube:",
      extItem1D: "Parâmetros de extração atualizados para contornar bloqueios anti-bot e o erro HTTP 403 Forbidden.",
      extItem2T: "Correção de Download de Áudio e Vídeo:",
      extItem2D: "Seleção dedicada de fluxos de áudio para downloads perfeitos em MP3, M4A, Opus e FLAC.",
      extItem3T: "Verificação de Versão do Companion:",
      extItem3D: "A extensão verifica o servidor e avisa caso a versão instalada seja anterior à v1.3.1.",
      extItem4T: "Diagnósticos e Registros Aprimorados:",
      extItem4D: "Feedback em tempo real e mensagens de erro transparentes exibidas diretamente no painel e histórico.",
      srvTitle: "Servidor Companion e Motor (v1.3.1)",
      srvSubtitle: "Atualização para Companion Server v1.3.1 Necessária!",
      srvItem1T: "Motor de Resolução JS (n-challenge):",
      srvItem1D: "Detecta automaticamente Node.js, Deno ou QuickJS e envia --js-runtimes para resolver os desafios do YouTube.",
      srvItem2T: "Detecção Automática de Cookies Multi-Navegador:",
      srvItem2D: "Compatibilidade com perfis e cookies do Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave e Opera.",
      srvItem3T: "Segurança de Cookies e Tokens Zero-Disco:",
      srvItem3D: "Processa cookies e tokens exclusivamente na RAM sem deixar rastros no disco rígido.",
      srvItem4T: "Alinhamento de Dependências do Motor:",
      srvItem4D: "Garante downloads suaves em 1080p, 4K, 60fps, Shorts e áudio no Windows e Linux.",
      ctaTitle: "💖 Apoie o projeto ou deixe uma avaliação!",
      ctaDesc: "Se você gosta da extensão, uma avaliação na loja do Mozilla Add-ons ajuda muito na visibilidade, ou pague-me um café no Ko-Fi!",
      ctaKofi: "☕ Pague-me um Ko-Fi!",
      ctaGithub: "⭐ Ver no GitHub",
      ctaReview: "⭐ Avaliar no Mozilla Add-ons"
    },
    fr: {
      title: "YT Media Downloader — Version v1.3.1",
      subtitle: "Nouveautés v1.3.1 : Paramètres YouTube mis à jour, résolution des défis JS et correction audio.",
      extTitle: "Stabilité du Moteur & Paramètres v1.3.1",
      extItem1T: "Alignement des Paramètres YouTube :",
      extItem1D: "Paramètres d'extraction adaptés pour contourner les blocages anti-bot et les erreurs HTTP 403 Forbidden.",
      extItem2T: "Correction Téléchargement Audio & Vidéo :",
      extItem2D: "Sélection dédiée des flux audio pour des exports impeccables en MP3, M4A, Opus et FLAC.",
      extItem3T: "Vérification de Version du Serveur :",
      extItem3D: "Affiche un avertissement clair si le serveur Companion installé est inférieur à la version v1.3.1.",
      extItem4T: "Diagnostics et Rapports Améliorés :",
      extItem4D: "Remontée précise des erreurs directement dans le panneau de téléchargement et l'historique.",
      srvTitle: "Serveur Companion & Moteur (v1.3.1)",
      srvSubtitle: "Mise à Jour vers Companion Server v1.3.1 Requise !",
      srvItem1T: "Moteur de Résolution JS (n-challenge) :",
      srvItem1D: "Détection automatique des environnements JS (Node.js, Deno, QuickJS) pour résoudre les défis YouTube avec --js-runtimes.",
      srvItem2T: "Détection des Cookies Multi-Navigateurs :",
      srvItem2D: "Prise en charge automatique des profils Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave et Opera.",
      srvItem3T: "Sécurité Cookies & Tokens Zéro-Disque :",
      srvItem3D: "Traite les cookies et jetons en mémoire vive sans aucune écriture sur le disque dur.",
      srvItem4T: "Alignement des Dépendances Moteur :",
      srvItem4D: "Assure des téléchargements fluides en 1080p, 4K, 60fps, Shorts et audio sous Windows et Linux.",
      ctaTitle: "💖 Soutenez le projet ou laissez un avis !",
      ctaDesc: "Si vous appréciez l'extension, un avis sur Mozilla Add-ons nous aide énormément à gagner en visibilité, ou offrez-moi un café sur Ko-Fi !",
      ctaKofi: "☕ Offrez-moi un Ko-Fi !",
      ctaGithub: "⭐ Voir sur GitHub",
      ctaReview: "⭐ Évaluer sur Mozilla Add-ons"
    },
    de: {
      title: "YT Media Downloader — Version v1.3.1",
      subtitle: "Neuerungen in v1.3.1: YouTube-Parameter-Updates, JavaScript-Challenge-Solver und Audio-Fix.",
      extTitle: "Engine-Stabilität & Parameter v1.3.1",
      extItem1T: "YouTube-Parameter-Abstimmung:",
      extItem1D: "Aktualisierte Extraktionsparameter zur Umgehung von Anti-Bot-Sperren und HTTP 403 Forbidden Fehlern.",
      extItem2T: "Audio- & Video-Download Fix:",
      extItem2D: "Dedizierte Audio-Stream-Auswahl für reibungslose Downloads in MP3, M4A, Opus und FLAC.",
      extItem3T: "Companion-Server Versionsprüfung:",
      extItem3D: "Zeigt eine Warnung an, falls der installierte Companion-Server älter als v1.3.1 ist.",
      extItem4T: "Erweiterte Fehlerdiagnose:",
      extItem4D: "Liefert Echtzeit-Fehlermeldungen und genaue Rückmeldungen im Download-Panel und Verlauf.",
      srvTitle: "Companion-Server & Engine (v1.3.1)",
      srvSubtitle: "Aktualisierung auf Companion Server v1.3.1 erforderlich!",
      srvItem1T: "JavaScript n-Challenge Solver:",
      srvItem1D: "Erkennt automatisch Node.js, Deno oder QuickJS und übergibt --js-runtimes zur Lösung von YouTube-Challenges.",
      srvItem2T: "Multi-Browser Cookie-Erkennung:",
      srvItem2D: "Erkennt Sitzungscookies aus Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave und Opera.",
      srvItem3T: "Zero-Disk Cookie & Token Sicherheit:",
      srvItem3D: "Verarbeitet Cookies und Tokens ausschließlich im RAM ohne Festplattenspuren.",
      srvItem4T: "Engine & Abhängigkeiten Aktualisiert:",
      srvItem4D: "Garantiert reibungslose Downloads in 1080p, 4K, 60fps, Shorts und Audio unter Windows & Linux.",
      ctaTitle: "💖 Unterstütze das Projekt oder hinterlasse eine Bewertung!",
      ctaDesc: "Wenn dir die Erweiterung gefällt, hilft eine Bewertung im Mozilla Add-ons Store enorm für mehr Sichtbarkeit, oder spendiere mir einen Kaffee auf Ko-Fi!",
      ctaKofi: "☕ Kaufe mir einen Ko-Fi!",
      ctaGithub: "⭐ Auf GitHub ansehen",
      ctaReview: "⭐ Auf Mozilla Add-ons bewerten"
    },
    it: {
      title: "YT Media Downloader — Versione v1.3.1",
      subtitle: "Novità della versione v1.3.1: Parametri YouTube aggiornati, risoluzione sfide JS e correzione audio.",
      extTitle: "Stabilità del Motore e Parametri v1.3.1",
      extItem1T: "Allineamento Parametri di YouTube:",
      extItem1D: "Parametri di estrazione aggiornati per evitare i blocchi anti-bot e gli errori HTTP 403 Forbidden.",
      extItem2T: "Correzione Download Audio e Video:",
      extItem2D: "Assegnazione dedicata dei flussi audio per download perfetti in formato MP3, M4A, Opus e FLAC.",
      extItem3T: "Controllo Versione del Companion:",
      extItem3D: "Mostra un avviso se il server Companion installato è inferiore alla versione v1.3.1.",
      extItem4T: "Diagnostica e Segnalazione Errori:",
      extItem4D: "Visualizza feedback dettagliato ed errori in tempo reale sia nel pannello che nella cronologia.",
      srvTitle: "Server Companion & Engine (v1.3.1)",
      srvSubtitle: "Aggiornamento a Companion Server v1.3.1 Richiesto!",
      srvItem1T: "Motore di Risoluzione JS (n-challenge):",
      srvItem1D: "Rileva automaticamente Node.js, Deno o QuickJS inviando --js-runtimes per superare le sfide di YouTube.",
      srvItem2T: "Rilevamento Cookie Multi-Browser:",
      srvItem2D: "Riconoscimento automatico dei profili e cookie da Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave e Opera.",
      srvItem3T: "Sicurezza Zero-Disco per Cookie e Token:",
      srvItem3D: "Elabora cookie e token esclusivamente in memoria RAM senza salvare su disco.",
      srvItem4T: "Allineamento Dipendenze del Motore:",
      srvItem4D: "Garantisce download fluidi in 1080p, 4K, 60fps, Shorts ed estrazione audio su Windows e Linux.",
      ctaTitle: "💖 Supporta il progetto o lascia una recensione!",
      ctaDesc: "Se trovi utile l'estensione, una recensione nello store Mozilla Add-ons ci aiuta molto per la visibilità, oppure offrimi un caffè su Ko-Fi!",
      ctaKofi: "☕ Offrimi un Ko-Fi!",
      ctaGithub: "⭐ Vedi su GitHub",
      ctaReview: "⭐ Valuta su Mozilla Add-ons"
    },
    ru: {
      title: "YT Media Downloader — Релиз v1.3.1",
      subtitle: "Что нового в v1.3.1: Обновление параметров YouTube, решение JS-челленджей и исправление аудио.",
      extTitle: "Стабильность Движка и Параметров v1.3.1",
      extItem1T: "Обновление Параметров YouTube:",
      extItem1D: "Скорректированы параметры извлечения YouTube для обхода анти-бот систем и ошибок HTTP 403 Forbidden.",
      extItem2T: "Исправление Загрузки Аудио и Видео:",
      extItem2D: "Выделенный выбор аудиопотоков для стабильной загрузки в MP3, M4A, Opus и FLAC без сбоев.",
      extItem3T: "Проверка Версии Companion Server:",
      extItem3D: "Выводит предупреждение, если установленный Companion Server ниже версии v1.3.1.",
      extItem4T: "Расширенная Диагностика Ошибок:",
      extItem4D: "Отображает точные сообщения об ошибках непосредственно в панели загрузки и истории.",
      srvTitle: "Companion Server & Движок (v1.3.1)",
      srvSubtitle: "Требуется обновление Companion Server v1.3.1!",
      srvItem1T: "Движок Решения JS (n-challenge):",
      srvItem1D: "Автоматически определяет Node.js, Deno или QuickJS и передает --js-runtimes для прохождения защиты YouTube.",
      srvItem2T: "Поддержка Cookies из Браузеров:",
      srvItem2D: "Автоматически считывает профили и куки из Zen Browser, Floorp, LibreWolf, Waterfox, Chrome, Edge, Brave и Opera.",
      srvItem3T: "Безопасность Без Диска в ОЗУ:",
      srvItem3D: "Обрабатывает cookies и токены исключительно в ОЗУ без записи на диск.",
      srvItem4T: "Обновление Движка yt-dlp:",
      srvItem4D: "Обеспечивает стабильную загрузку в 1080p, 4K, 60fps, Shorts и аудио на Windows и Linux.",
      ctaTitle: "💖 Поддержите проект или оставьте отзыв!",
      ctaDesc: "Если вам нравится расширение, отзыв в магазине Mozilla Add-ons очень поможет в продвижении, или угостите меня кофе на Ko-Fi!",
      ctaKofi: "☕ Купить мне Ko-Fi!",
      ctaGithub: "⭐ Смотреть на GitHub",
      ctaReview: "⭐ Оценить на Mozilla Add-ons"
    },
    ja: {
      title: "YT Media Downloader — リリース v1.3.1",
      subtitle: "v1.3.1の新機能: YouTubeパラメータの更新、JavaScriptチャレンジの解決、および音声修正。",
      extTitle: "エンジン安定性 & パラメータ v1.3.1",
      extItem1T: "YouTubeパラメータの最適化:",
      extItem1D: "YouTubeの抽出パラメータを更新し、Anti-BotおよびHTTP 403 Forbiddenエラーを回避します。",
      extItem2T: "音声・動画ダウンロードの修正:",
      extItem2D: "MP3、M4A、Opus、FLACのロスレス抽出に最適な専用音声ストリームを明示的に選択します。",
      extItem3T: "Companionサーバーのバージョン確認:",
      extItem3D: "Companionサーバーがv1.3.1未満の場合、明確な更新通知を表示します。",
      extItem4T: "診断・エラー通知の強化:",
      extItem4D: "ダウンロードパネルおよび履歴にリアルタイムのエラーメッセージを正確に表示します。",
      srvTitle: "Companion サーバー & エンジン (v1.3.1)",
      srvSubtitle: "Companion Server v1.3.1 への更新が必要です！",
      srvItem1T: "JavaScript n-Challenge 解決エンジン:",
      srvItem1D: "システム内のNode.js、Deno、QuickJSを自動検出し、--js-runtimesを適用してYouTubeの検証を通過します。",
      srvItem2T: "複数ブラウザのCookie自動検出:",
      srvItem2D: "Zen Browser、Floorp、LibreWolf、Waterfox、Chrome、Edge、Brave、Operaのクッキーを自動検出します。",
      srvItem3T: "メモリ内処理による完全なセキュリティ:",
      srvItem3D: "クッキーおよびトークンをRAMのみで処理し、ディスクに一切保存しません。",
      srvItem4T: "yt-dlpエンジンの最適化:",
      srvItem4D: "1080p、4K、60fps、Shortsおよび音声処理の安定動作をWindowsおよびLinuxで保証します。",
      ctaTitle: "💖 プロジェクトの応援・レビューをお願いします！",
      ctaDesc: "拡張機能が役に立った場合は、Mozilla Add-onsストアでの評価やKo-Fiでのご支援をいただけると大変励みになります！",
      ctaKofi: "☕ Ko-Fiで応援する！",
      ctaGithub: "⭐ GitHubで見る",
      ctaReview: "⭐ Mozilla Add-onsで評価する"
    },
    zh: {
      title: "YT Media Downloader — 发布版本 v1.3.1",
      subtitle: "v1.3.1 更新说明: YouTube 参数更新、JavaScript 挑战求解与音频下载修复。",
      extTitle: "核心稳定性与参数优化 v1.3.1",
      extItem1T: "YouTube 参数对齐:",
      extItem1D: "更新 YouTube 提取参数，有效绕过反爬机制并解决 HTTP 403 Forbidden 封锁。",
      extItem2T: "音频与视频提取修复:",
      extItem2D: "强化专用最佳音频流选择，支持高保真 MP3、M4A、Opus 及 FLAC 音频转换。",
      extItem3T: "Companion 服务端版本检测:",
      extItem3D: "扩展将自动检测 Companion 版本，若低于 v1.3.1 将弹出更新提示。",
      extItem4T: "增强型诊断与错误报告:",
      extItem4D: "在下载面板与历史记录中提供实时且精确的错误提示反馈。",
      srvTitle: "Companion 服务端与引擎 (v1.3.1)",
      srvSubtitle: "需要更新至 Companion Server v1.3.1！",
      srvItem1T: "JavaScript n-Challenge 求解引擎:",
      srvItem1D: "自动检测系统中的 Node.js、Deno 或 QuickJS，并传递 --js-runtimes 解决 YouTube 脚本挑战。",
      srvItem2T: "多浏览器 Cookie 自动检测:",
      srvItem2D: "自动检测 Zen Browser、Floorp、LibreWolf、Waterfox、Chrome、Edge、Brave 及 Opera 会话凭据。",
      srvItem3T: "零磁盘 Cookie 与 Token 安全:",
      srvItem3D: "Cookie 与 Token 仅在内存中处理，随用随擦，零磁盘残留。",
      srvItem4T: "更新 yt-dlp 引擎依赖:",
      srvItem4D: "保障 Windows 与 Linux 平台下 1080p、4K、60fps、Shorts 及音频的高效稳定。",
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

/*
 * Changelog Page Script - YT Media Downloader Extension v1.2.7
 * Multi-language support & language switcher
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  const translations = {
    en: {
      title: "YT Media Downloader — Release v1.2.9",
      subtitle: "What's new in v1.2.9 across the Extension and Companion Server.",
      extTitle: "YouTube Shorts & Modal Upgrades",
      extItem1T: "Shorts Action Bar Positioning:",
      extItem1D: "The download button now sits right above the Heart (Like) button on YouTube Shorts.",
      extItem2T: "Shorts Modal Birthplace:",
      extItem2D: "The Download window opens right alongside the Shorts action bar for a seamless experience.",
      extItem3T: "Position Memory & Screen Clamping:",
      extItem3D: "Remembers where you dragged the window, strictly preventing it from leaving the visible browser screen.",
      extItem4T: "Single Viewport Layout:",
      extItem4D: "Eliminated layout clipping for a clean, single-page view across all monitor resolutions.",
      srvTitle: "Companion Server & Engine (v1.2.9)",
      srvSubtitle: "No changes in Companion, v1.2.8 stable & functional",
      srvItem1T: "Zero-Disk Cookie Security:",
      srvItem1D: "Processes active player cookies exclusively in RAM with instant 0-byte file cleanup.",
      srvItem2T: "Native OS Folder Selector:",
      srvItem2D: "Opens native Windows/Linux folder picker windows, remembering the last selected folder.",
      srvItem3T: "Legacy Cookie Auto-Purge:",
      srvItem3D: "Automatically purges legacy cookie files (.yt_cookies.txt, cookies.txt) on server startup.",
      srvItem4T: "Updated Engine Dependencies:",
      srvItem4D: "Ensures smooth 1080p, 4K, 60fps and audio extraction capabilities.",
      ctaTitle: "💖 Support the project or leave a review!",
      ctaDesc: "If you find this app helpful, a review on the Mozilla Add-ons store is immensely appreciated to gain visibility, or consider buying me a Ko-Fi!",
      ctaKofi: "☕ Buy me a Ko-Fi!",
      ctaReview: "⭐ Rate on Firefox Add-ons"
    },
    es: {
      title: "YT Media Downloader — Versión v1.2.9",
      subtitle: "Novedades de la versión v1.2.9 en la Extensión y el Servidor Companion.",
      extTitle: "Mejoras en YouTube Shorts y Ventana Modal",
      extItem1T: "Ubicación del Botón en Shorts:",
      extItem1D: "El botón de descarga ahora se ubica justo por encima del botón de Me Gusta (corazón) en YouTube Shorts.",
      extItem2T: "Nacimiento de la Ventana en Shorts:",
      extItem2D: "La ventana de descarga se abre directamente junto a la barra de acciones de Shorts para mayor comodidad.",
      extItem3T: "Memoria de Posición y Límite de Pantalla:",
      extItem3D: "Recuerda la ubicación donde arrastraste la ventana e impide estrictamente que se salga de la pantalla.",
      extItem4T: "Diseño de Pantalla Única:",
      extItem4D: "Maquetado optimizado en una sola pantalla sin necesidad de desplazar la ventana.",
      srvTitle: "Servidor Companion y Motor (v1.2.9)",
      srvSubtitle: "No cambios en el Companion, v1.2.8-estable y funcional",
      srvItem1T: "Seguridad de Cookies Cero-Disco:",
      srvItem1D: "Procesa las cookies del reproductor exclusivamente en RAM con borrado instantáneo a 0 bytes.",
      srvItem2T: "Selector Nativo de Carpeta:",
      srvItem2D: "Abre la ventana nativa de selección de carpeta en Windows/Linux recordando la última ubicación.",
      srvItem3T: "Depuración Automática de Cookies:",
      srvItem3D: "Detecta y elimina automáticamente archivos de texto plano (.yt_cookies.txt) al iniciar el servidor.",
      srvItem4T: "Motor yt-dlp Actualizado:",
      srvItem4D: "Garantiza descargas fluidas en 1080p, 4K, 60fps y extracción de audio.",
      ctaTitle: "💖 ¡Apoya el proyecto o deja una valoración!",
      ctaDesc: "Si disfrutas de la extensión, agradecería muchísimo tu calificación en la tienda de Mozilla Add-ons para tener más visibilidad, ¡o invítame un cafecito en Ko-Fi!",
      ctaKofi: "☕ ¡Buy me a Ko-Fi!",
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
      ctaReview: "⭐ Avaliar no Mozilla Add-ons"
    },
    fr: {
      title: "YT Media Downloader — Version v1.2.9",
      subtitle: "Nouveautés de la version v1.2.9 sur l'extension et le serveur Companion.",
      extTitle: "Améliorations YouTube Shorts et Fenêtre Modale",
      extItem1T: "Position du Bouton Shorts:",
      extItem1D: "Le bouton de téléchargement se place juste au-dessus du bouton J'aime (cœur) sur YouTube Shorts.",
      extItem2T: "Ouverture de la Fenêtre Shorts:",
      extItem2D: "La fenêtre de téléchargement s'ouvre directement à côté de la barre d'actions des Shorts.",
      extItem3T: "Mémorisation de la Position et Limites:",
      extItem3D: "Mémorise l'emplacement de la fenêtre et l'empêche strictement de sortir de l'écran.",
      extItem4T: "Affichage Plein Écran Unique:",
      extItem4D: "Mise en page optimisée pour s'adapter sur une seule page sans défilement.",
      srvTitle: "Serveur Companion & Moteur (v1.2.9)",
      srvSubtitle: "Aucun changement dans Companion, v1.2.8 stable et fonctionnel",
      srvItem1T: "Sécurité Cookies Zéro-Disque:",
      srvItem1D: "Traite les cookies exclusivement en RAM avec suppression instantanée.",
      srvItem2T: "Sélecteur Natif de Dossiers:",
      srvItem2D: "Ouvre le sélecteur de dossier natif du système en retenant le dernier dossier.",
      srvItem3T: "Nettoyage Automatique des Cookies:",
      srvItem3D: "Supprime automatiquement les anciens fichiers cookies au démarrage du serveur.",
      srvItem4T: "Moteur yt-dlp Mis à Jour:",
      srvItem4D: "Assure des téléchargements fluides en 1080p, 4K, 60fps et extraction audio.",
      ctaTitle: "💖 Soutenez le projet ou laissez un avis !",
      ctaDesc: "Si vous appréciez l'extension, un avis sur Mozilla Add-ons nous aide énormément à gagner en visibilité, ou offrez-moi un café sur Ko-Fi !",
      ctaKofi: "☕ Offrez-moi un Ko-Fi !",
      ctaReview: "⭐ Évaluer sur Mozilla Add-ons"
    },
    de: {
      title: "YT Media Downloader — Version v1.2.9",
      subtitle: "Neuerungen in v1.2.9 für Erweiterung und Companion-Server.",
      extTitle: "YouTube Shorts & Modal Upgrades",
      extItem1T: "Shorts Button-Positionierung:",
      extItem1D: "Der Download-Button befindet sich jetzt direkt über dem Gefällt-mir-Button (Herz) bei Shorts.",
      extItem2T: "Shorts Modal-Eröffnung:",
      extItem2D: "Das Download-Fenster öffnet sich direkt neben der Shorts-Aktionsleiste.",
      extItem3T: "Positionsspeicher & Bildschirmbegrenzung:",
      extItem3D: "Merkt sich die Fensterposition und verhindert das Verlassen des sichtbaren Bildschirms.",
      extItem4T: "Einzelseiten-Layout:",
      extItem4D: "Optimiertes Layout, das perfekt auf eine einzelne Seite ohne Scrollen passt.",
      srvTitle: "Companion-Server & Engine (v1.2.9)",
      srvSubtitle: "Keine Änderungen im Companion, v1.2.8 stabil & funktional",
      srvItem1T: "Zero-Disk Cookie-Sicherheit:",
      srvItem1D: "Verarbeitet Cookies ausschließlich im RAM mit sofortiger Bereinigung.",
      srvItem2T: "Nativer Ordner-Auswähler:",
      srvItem2D: "Öffnet den nativen System-Ordner-Auswähler und merkt sich den letzten Pfad.",
      srvItem3T: "Automatische Cookie-Bereinigung:",
      srvItem3D: "Löscht alte Cookie-Dateien automatisch beim Serverstart.",
      srvItem4T: "Aktualisierte yt-dlp Engine:",
      srvItem4D: "Garantiert reibungslose Downloads in 1080p, 4K, 60fps und Audio-Extraktion.",
      ctaTitle: "💖 Unterstütze das Projekt oder hinterlasse eine Bewertung!",
      ctaDesc: "Wenn dir die Erweiterung gefällt, hilft eine Bewertung im Mozilla Add-ons Store enorm für mehr Sichtbarkeit, oder spendiere mir einen Kaffee auf Ko-Fi!",
      ctaKofi: "☕ Kaufe mir einen Ko-Fi!",
      ctaReview: "⭐ Auf Mozilla Add-ons bewerten"
    },
    it: {
      title: "YT Media Downloader — Versione v1.2.9",
      subtitle: "Novità della versione v1.2.9 per l'Estensione e il Server Companion.",
      extTitle: "Miglioramenti YouTube Shorts e Finestra Modale",
      extItem1T: "Posizionamento Pulsante Shorts:",
      extItem1D: "Il pulsante di download ora si trova proprio sopra il pulsante Mi Piace (cuore) su Shorts.",
      extItem2T: "Apertura Finestra Shorts:",
      extItem2D: "La finestra di download si apre direttamente accanto alla barra delle azioni dei Shorts.",
      extItem3T: "Memoria di Posizione e Limiti dello Schermo:",
      extItem3D: "Ricorda dove hai trascinato la finestra ed evita che esca dallo schermo visibile.",
      extItem4T: "Layout a Pagina Singola:",
      extItem4D: "Layout ottimizzato per adattarsi a una singola schermata senza scorrimento.",
      srvTitle: "Server Companion & Engine (v1.2.9)",
      srvSubtitle: "Nessuna modifica nel Companion, v1.2.8 stabile e funzionale",
      srvItem1T: "Sicurezza Cookie Zero-Disco:",
      srvItem1D: "Elabora i cookie esclusivamente in RAM con pulizia istantanea.",
      srvItem2T: "Selettore Cartelle Nativo:",
      srvItem2D: "Apre la finestra nativa del sistema ricordando l'ultima cartella selezionata.",
      srvItem3T: "Pulizia Automatica Cookie:",
      srvItem3D: "Rimuove automaticamente i vecchi file cookie all'avvio del server.",
      srvItem4T: "Motore yt-dlp Aggiornato:",
      srvItem4D: "Garantisce download fluidi in 1080p, 4K, 60fps ed estrazione audio.",
      ctaTitle: "💖 Supporta il progetto o lascia una recensione!",
      ctaDesc: "Se trovi utile l'estensione, una recensione nello store Mozilla Add-ons ci aiuta molto per la visibilità, oppure offrimi un caffè su Ko-Fi!",
      ctaKofi: "☕ Offrimi un Ko-Fi!",
      ctaReview: "⭐ Valuta su Mozilla Add-ons"
    },
    ru: {
      title: "YT Media Downloader — Релиз v1.2.9",
      subtitle: "Что нового в v1.2.9 в Расширении и Сервере Companion.",
      extTitle: "Улучшения YouTube Shorts и Модального Окна",
      extItem1T: "Кнопка в YouTube Shorts:",
      extItem1D: "Кнопка скачивания теперь располагается прямо над кнопкой Нравится (сердце).",
      extItem2T: "Открытие Окна в Shorts:",
      extItem2D: "Окно скачивания открывается прямо рядом с панелью действий Shorts.",
      extItem3T: "Память Позиции и Границы Экрана:",
      extItem3D: "Запоминает положение окна и строго предотвращает его выход за пределы экрана.",
      extItem4T: "Макет на Одной Странице:",
      extItem4D: "Оптимизировано для отображения на одном экране без прокрутки.",
      srvTitle: "Companion Server & Движок (v1.2.9)",
      srvSubtitle: "Без изменений в Companion, v1.2.8 стабилен и функционален",
      srvItem1T: "Безопасность Без Диска:",
      srvItem1D: "Обрабатывает cookies исключительно в ОЗУ с мгновенной очисткой.",
      srvItem2T: "Нативный Выбор Папки:",
      srvItem2D: "Открывает стандартное окно выбора папки ОС, запоминая последний путь.",
      srvItem3T: "Авто-Очистка Старых Cookies:",
      srvItem3D: "Автоматически удаляет старые файлы cookies при запуске сервера.",
      srvItem4T: "Обновленный Движок yt-dlp:",
      srvItem4D: "Обеспечивает плавную загрузку в 1080p, 4K, 60fps и аудио.",
      ctaTitle: "💖 Поддержите проект или оставьте отзыв!",
      ctaDesc: "Если вам нравится расширение, отзыв в магазине Mozilla Add-ons очень поможет в продвижении, или угостите меня кофе на Ko-Fi!",
      ctaKofi: "☕ Купить мне Ko-Fi!",
      ctaReview: "⭐ Оценить на Mozilla Add-ons"
    },
    ja: {
      title: "YT Media Downloader — リリース v1.2.9",
      subtitle: "拡張機能およびCompanionサーバーのv1.2.9の新機能。",
      extTitle: "YouTube Shorts & モーダルウィンドウの改善",
      extItem1T: "Shortsボタンの配置:",
      extItem1D: "ダウンロードボタンがShortsの高評価（ハート）ボタンの真上に配置されるようになりました。",
      extItem2T: "Shortsウィンドウの表示位置:",
      extItem2D: "ダウンロードウィンドウがShortsアクションバーのすぐ横に開くようになりました。",
      extItem3T: "位置記憶 & 画面枠制限:",
      extItem3D: "ウィンドウのドラッグ位置を記憶し、画面外への飛び出しを防止します。",
      extItem4T: "単一画面レイアウト:",
      extItem4D: "スクロール不要で1画面にすっきり収まるよう最適化されました。",
      srvTitle: "Companion サーバー & エンジン (v1.2.9)",
      srvSubtitle: "Companionの変更なし、v1.2.8で安定動作中",
      srvItem1T: "メモリ内クッキー処理:",
      srvItem1D: "クッキーをRAMのみで処理し、ディスクに残さず即座に消去します。",
      srvItem2T: "OS標準フォルダ選択:",
      srvItem2D: "OS標準のフォルダ選択ダイアログを開き、最後の保存先を記憶します。",
      srvItem3T: "旧クッキーの自動削除:",
      srvItem3D: "起動時に古いクッキーファイルを自動的に削除します。",
      srvItem4T: "yt-dlpエンジンの更新:",
      srvItem4D: "1080p、4K、60fpsおよび音声抽出の安定動作を保証します。",
      ctaTitle: "💖 プロジェクトの応援・レビューをお願いします！",
      ctaDesc: "拡張機能が役に立った場合は、Mozilla Add-onsストアでの評価やKo-Fiでのご支援をいただけると大変励みになります！",
      ctaKofi: "☕ Ko-Fiで応援する！",
      ctaReview: "⭐ Mozilla Add-onsで評価する"
    },
    zh: {
      title: "YT Media Downloader — 发布版本 v1.2.9",
      subtitle: "扩展程序与 Companion 服务端 v1.2.9 更新说明。",
      extTitle: "YouTube Shorts & 弹窗功能升级",
      extItem1T: "Shorts 按钮位置优化:",
      extItem1D: "下载按钮现已精准放置于 YouTube Shorts 点赞（爱心）按钮的正上方。",
      extItem2T: "Shorts 弹窗打开位置:",
      extItem2D: "下载窗口将直接在 Shorts 操作栏旁打开，操作更便捷。",
      extItem3T: "位置记忆与屏幕边界限制:",
      extItem3D: "可记住拖拽后的窗口位置，并严格防止窗口超出屏幕可视区域。",
      extItem4T: "单屏完整显示布局:",
      extItem4D: "优化页面布局，无需滚动页面即可一屏完整展现。",
      srvTitle: "Companion 服务端与引擎 (v1.2.9)",
      srvSubtitle: "Companion 无变更，v1.2.8 稳定可用",
      srvItem1T: "零磁盘 Cookie 安全:",
      srvItem1D: "Cookie 仅在内存中处理，随用随擦，不留磁盘痕迹。",
      srvItem2T: "原生系统文件夹选择器:",
      srvItem2D: "调用 Windows/Linux 原生文件选择窗口，自动记忆上次目录。",
      srvItem3T: "旧 Cookie 自动清理:",
      srvItem3D: "服务端启动时自动清理残留的旧文本 Cookie 文件。",
      srvItem4T: "更新 yt-dlp 引擎:",
      srvItem4D: "保障 1080p、4K、60fps 及音频解析的高效稳定。",
      ctaTitle: "💖 支持项目或留下评价！",
      ctaDesc: "如果您喜欢这款扩展，欢迎在 Mozilla Add-ons 商店留下评价帮助我们获得更多曝光，或者在 Ko-Fi 上请我喝杯咖啡！",
      ctaKofi: "☕ 在 Ko-Fi 请我喝咖啡！",
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

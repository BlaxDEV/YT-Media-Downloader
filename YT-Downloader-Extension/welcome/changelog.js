/*
 * Changelog Page Script - YT Media Downloader Extension v1.3.2
 * Multi-language support & language switcher
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  const translations = {
    en: {
      title: "YT Media Downloader — Release v1.3.2",
      subtitle: "What's new in v1.3.2: Automated AV-safe updates, playlist download fixes, sequential queue & history cancellation.",
      extTitle: "Automated Updates & Extension Upgrades (v1.3.2)",
      extItem1T: "Automated AV-Safe Update System:",
      extItem1D: "Smart detection of new releases from GitHub with an in-app interactive modal, progress bar, and safe UAC installer execution.",
      extItem2T: "Playlist Download & Folder Routing:",
      extItem2D: "Restored native folder selection routing and sanitized playlist item parameters so selected playlist videos download cleanly.",
      extItem3T: "Protected Intent & Audio Control:",
      extItem3D: "Audio download button is disabled until formats load, and strictly targets the current playing video unless playlist items are explicitly chosen.",
      extItem4T: "Queued Downloads & Live History:",
      extItem4D: "Batch playlist downloads are registered immediately in History as 'Queued...' and can be individually cancelled at any time.",
      srvTitle: "Companion Server & Sequential Engine (v1.3.2)",
      srvSubtitle: "Companion Server v1.3.2 Update Available!",
      srvItem1T: "Native Update Endpoints (/check_update, /install_update):",
      srvItem1D: "Enables non-invasive downloading and execution of the official installer with standard Windows UAC confirmation.",
      srvItem2T: "Sequential Download Queue:",
      srvItem2D: "Processes playlist batches sequentially in a background worker to avoid YouTube HTTP 429 rate limit blocks.",
      srvItem3T: "Native Folder Picker /select_folder:",
      srvItem3D: "Restored directory picker dialog route for seamless destination folder selection.",
      srvItem4T: "Robust History Serialization:",
      srvItem4D: "Completely decoupled live subprocess handles from disk history to eliminate JSON serialization errors.",
      ctaTitle: "💖 Support the project or leave a review!",
      ctaDesc: "If you find this app helpful, a review on the Mozilla Add-ons store is immensely appreciated to gain visibility, or consider buying me a Ko-Fi!",
      ctaKofi: "☕ Buy me a Ko-Fi!",
      ctaGithub: "⭐ View on GitHub",
      ctaReview: "⭐ Rate on Firefox Add-ons"
    },
    es: {
      title: "YT Media Downloader — Versión v1.3.2",
      subtitle: "Novedades de la versión v1.3.2: Actualizaciones automatizadas seguras (AV-Safe), corrección de listas, cola secuencial y cancelación en historial.",
      extTitle: "Actualizaciones Automatizadas y Extensión (v1.3.2)",
      extItem1T: "Sistema de Actualizaciones Automatizadas (AV-Safe):",
      extItem1D: "Detección inteligente de versiones en GitHub con modal interactivo, barra de descarga en tiempo real y ejecución con UAC sin alertas de antivirus.",
      extItem2T: "Corrección de Descarga de Playlists y Selector:",
      extItem2D: "Restaurado el selector de carpetas y sanitización completa de parámetros al descargar videos seleccionados de la playlist.",
      extItem3T: "Control Inteligente de Audio e Intención:",
      extItem3D: "Botón de audio deshabilitado hasta la carga completa de formatos, descargando solo el video actual salvo selección explícita de playlist.",
      extItem4T: "Descargas en Cola y Cancelación en Historial:",
      extItem4D: "Los lotes de playlist aparecen al instante en el Historial en estado 'En cola...' y pueden cancelarse individualmente.",
      srvTitle: "Servidor Companion y Motor Secuencial (v1.3.2)",
      srvSubtitle: "¡Companion Server v1.3.2 disponible para descarga!",
      srvItem1T: "Endpoints de Actualización (/check_update, /install_update):",
      srvItem1D: "Descarga automatizada y lanzamiento delegado al Shell de Windows mediante UAC oficial.",
      srvItem2T: "Cola de Descarga Secuencial:",
      srvItem2D: "Procesa los videos de listas de forma secuencial en segundo plano para evitar bloqueos por tasa de peticiones (HTTP 429).",
      srvItem3T: "Ruta de Selector Nativo /select_folder:",
      srvItem3D: "Restaurada la ruta de diálogo de selección de carpeta de descarga sin errores.",
      srvItem4T: "Historial Robusto y Serialización Limpia:",
      srvItem4D: "Aislado completamente el manejo de procesos del historial en disco para evitar fallos de JSON.",
      ctaTitle: "💖 ¡Apoya el proyecto o déjanos una reseña!",
      ctaDesc: "Si esta herramienta te es de utilidad, una valoración en la tienda de Firefox Add-ons ayuda enormemente a ganar visibilidad, ¡o invítame un café!",
      ctaKofi: "☕ ¡Invítame un Ko-Fi!",
      ctaGithub: "⭐ Ver en GitHub",
      ctaReview: "⭐ Calificar en Firefox Add-ons"
    },
    pt: {
      title: "YT Media Downloader — Versão v1.3.2",
      subtitle: "Novidades da versão v1.3.2: Atualizações automáticas seguras, correção de playlists, fila e cancelamento no histórico.",
      extTitle: "Atualizações Automáticas e Melhorias (v1.3.2)",
      extItem1T: "Sistema de Atualizações Automáticas (AV-Safe):",
      extItem1D: "Detecção inteligente de versões no GitHub com modal interativo, barra de download e execução com UAC sem alertas de antivírus.",
      extItem2T: "Correção de Playlists e Seleção de Pastas:",
      extItem2D: "Restaurada a seleção de pastas nativa e higienização de parâmetros ao baixar vídeos da playlist.",
      extItem3T: "Controle Inteligente de Áudio:",
      extItem3D: "Botão de áudio protegido até carregar os formatos, baixando apenas o vídeo atual salvo seleção explícita da lista.",
      extItem4T: "Fila de Downloads e Cancelamento no Histórico:",
      extItem4D: "Downloads de playlist aparecem imediatamente no Histórico como 'Na fila...' e podem ser cancelados individualmente.",
      srvTitle: "Servidor Companion e Motor Sequencial (v1.3.2)",
      srvSubtitle: "Companion Server v1.3.2 disponível!",
      srvItem1T: "Rotas de Atualização (/check_update, /install_update):",
      srvItem1D: "Download automático e inicialização do instalador oficial com confirmação do Windows UAC.",
      srvItem2T: "Fila de Download Sequencial:",
      srvItem2D: "Processa lotes de vídeos em segundo plano evitando bloqueios de taxa HTTP 429.",
      srvItem3T: "Seletor de Pastas /select_folder:",
      srvItem3D: "Diálogo nativo restaurado para seleção transparente de pastas de destino.",
      srvItem4T: "Serialização Confiável do Histórico:",
      srvItem4D: "Processos isolados do histórico em disco para garantir integridade JSON absoluta.",
      ctaTitle: "💖 Apoie o projeto ou deixe uma avaliação!",
      ctaDesc: "Se este aplicativo foi útil para você, uma avaliação no Mozilla Add-ons nos ajuda imensamente!",
      ctaKofi: "☕ Compre um Ko-Fi!",
      ctaGithub: "⭐ Ver no GitHub",
      ctaReview: "⭐ Avaliar no Firefox Add-ons"
    },
    fr: {
      title: "YT Media Downloader — Version v1.3.2",
      subtitle: "Nouveautés de la v1.3.2 : Mises à jour automatiques sécurisées, correction de playlists, file d'attente et annulation.",
      extTitle: "Mises à Jour Automatiques & Extension (v1.3.2)",
      extItem1T: "Système de Mise à Jour Sécurisé (AV-Safe) :",
      extItem1D: "Détection automatique des versions sur GitHub avec modal interactif et lancement UAC sans faux positifs d'antivirus.",
      extItem2T: "Correction de Téléchargement de Playlists :",
      extItem2D: "Restauration du sélecteur de dossier et assainissement des paramètres lors du téléchargement des playlists.",
      extItem3T: "Contrôle Intelligent de l'Audio :",
      extItem3D: "Bouton audio désactivé jusqu'au chargement complet, ciblant uniquement la vidéo en cours sauf sélection explicite.",
      extItem4T: "File d'Attente & Annulation dans l'Historique :",
      extItem4D: "Les vidéos apparaissent instantanément dans l'Historique en 'En file d'attente...' et peuvent être annulées.",
      srvTitle: "Serveur Companion & Moteur Séquentiel (v1.3.2)",
      srvSubtitle: "Companion Server v1.3.2 disponible !",
      srvItem1T: "Routes de Mise à Jour (/check_update, /install_update) :",
      srvItem1D: "Téléchargement automatique et lancement de l'installateur officiel via UAC.",
      srvItem2T: "File de Téléchargement Séquentielle :",
      srvItem2D: "Traite les vidéos séquentiellement en arrière-plan pour éviter les blocages de débit HTTP 429.",
      srvItem3T: "Sélecteur de Dossier /select_folder :",
      srvItem3D: "Restauration du dialogue de sélection de dossier natif.",
      srvItem4T: "Sérialisation Robuste de l'Historique :",
      srvItem4D: "Processus totalement dissociés de l'historique sur disque.",
      ctaTitle: "💖 Soutenez le projet ou laissez un avis !",
      ctaDesc: "Si vous appréciez cette extension, un avis sur Mozilla Add-ons nous aide grandement !",
      ctaKofi: "☕ Offrez-moi un Ko-Fi !",
      ctaGithub: "⭐ Voir sur GitHub",
      ctaReview: "⭐ Noter sur Firefox Add-ons"
    },
    de: {
      title: "YT Media Downloader — Version v1.3.2",
      subtitle: "Neuheiten in v1.3.2: Sichere automatische Updates, Playlist-Korrekturen, Warteschlange und Verlauf-Abbruch.",
      extTitle: "Automatische Updates & Erweiterung (v1.3.2)",
      extItem1T: "Sicheres Update-System (AV-Safe):",
      extItem1D: "Intelligente Erkennung neuer Releases auf GitHub mit In-App-Modal und UAC-Ausführung ohne Antivirus-Warnungen.",
      extItem2T: "Playlist-Download & Ordnerauswahl:",
      extItem2D: "Wiederherstellung der nativen Ordnerauswahl und Bereinigung der Parameter bei Playlist-Downloads.",
      extItem3T: "Intelligente Audio-Steuerung:",
      extItem3D: "Audio-Button deaktiviert bis zum Laden der Formate; lädt nur das aktuelle Video außer bei Playlist-Auswahl.",
      extItem4T: "Warteschlange & Abbruch im Verlauf:",
      extItem4D: "Downloads erscheinen sofort im Verlauf als 'In der Warteschlange...' und können einzeln abgebrochen werden.",
      srvTitle: "Companion-Server & Warteschlangen-Engine (v1.3.2)",
      srvSubtitle: "Companion Server v1.3.2 verfügbar!",
      srvItem1T: "Update-Endpunkte (/check_update, /install_update):",
      srvItem1D: "Automatisiertes Herunterladen und Ausführen des offiziellen Installationsprogramms.",
      srvItem2T: "Sequenzielle Download-Warteschlange:",
      srvItem2D: "Verarbeitet Playlist-Batches nacheinander im Hintergrund gegen HTTP 429 Ratenbegrenzungen.",
      srvItem3T: "Nativer Ordnerwähler /select_folder:",
      srvItem3D: "Wiederherstellung des nativen Verzeichnisdialogs.",
      srvItem4T: "Zuverlässige Verlauf-Serialisierung:",
      srvItem4D: "Vollständige Isolierung von Prozess-Handles vom Disk-Verlauf.",
      ctaTitle: "💖 Unterstützen Sie das Projekt oder hinterlassen Sie eine Bewertung!",
      ctaDesc: "Wenn Ihnen diese App gefällt, freuen wir uns riesig über eine Bewertung auf Mozilla Add-ons!",
      ctaKofi: "☕ Spendieren Sie mir einen Ko-Fi!",
      ctaGithub: "⭐ Auf GitHub ansehen",
      ctaReview: "⭐ Auf Firefox Add-ons bewerten"
    },
    it: {
      title: "YT Media Downloader — Versione v1.3.2",
      subtitle: "Novità della versione v1.3.2: Aggiornamenti automatici sicuri, correzione playlist, coda e annullamento.",
      extTitle: "Aggiornamenti Automatici & Estensione (v1.3.2)",
      extItem1T: "Sistema di Aggiornamento Sicuro (AV-Safe):",
      extItem1D: "Rilevamento intelligente dei rilasci su GitHub con modale interattiva ed esecuzione con UAC senza falsi positivi.",
      extItem2T: "Correzione Playlist e Selezione Cartella:",
      extItem2D: "Ripristino del selettore cartelle nativo e pulizia dei parametri per i download di playlist.",
      extItem3T: "Controllo Intelligente dell'Audio:",
      extItem3D: "Pulsante audio disattivato fino al caricamento dei formati; scarica solo il video in riproduzione.",
      extItem4T: "Download in Coda e Annullamento:",
      extItem4D: "I download di playlist appaiono subito nella Cronologia come 'In coda...' e possono essere annullati.",
      srvTitle: "Server Companion & Motore Sequenziale (v1.3.2)",
      srvSubtitle: "Companion Server v1.3.2 disponibile!",
      srvItem1T: "Endpoint di Aggiornamento (/check_update, /install_update):",
      srvItem1D: "Download automatico ed esecuzione dell'installer ufficiale con conferma UAC.",
      srvItem2T: "Coda di Download Sequenziale:",
      srvItem2D: "Elabora i video in sequenza in background per prevenire blocchi di frequenza HTTP 429.",
      srvItem3T: "Selettore di Cartelle /select_folder:",
      srvItem3D: "Ripristinato il dialogo nativo per la scelta della cartella.",
      srvItem4T: "Serializzazione Affidabile della Cronologia:",
      srvItem4D: "Handle di processo isolati per prevenire errori JSON su disco.",
      ctaTitle: "💖 Supporta il progetto o lascia una recensione!",
      ctaDesc: "Se trovi utile questa applicazione, una recensione su Mozilla Add-ons è immensamente apprezzata!",
      ctaKofi: "☕ Offrimi un Ko-Fi!",
      ctaGithub: "⭐ Visualizza su GitHub",
      ctaReview: "⭐ Valuta su Firefox Add-ons"
    },
    ru: {
      title: "YT Media Downloader — Релиз v1.3.2",
      subtitle: "Что нового в v1.3.2: Безопасные авто-обновления, исправление плейлистов, очередь и отмена в истории.",
      extTitle: "Авто-Обновления и Улучшения (v1.3.2)",
      extItem1T: "Безопасная Система Авто-Обновлений (AV-Safe):",
      extItem1D: "Умный поиск релизов на GitHub со встроенным окном, шкалой загрузки и запуском установщика через UAC.",
      extItem2T: "Исправление Загрузки Плейлистов:",
      extItem2D: "Восстановлен выбор папки и очищены параметры при скачивании элементов плейлиста.",
      extItem3T: "Умный Контроль Аудио:",
      extItem3D: "Кнопка аудио заблокирована до загрузки форматов и скачивает только текущее видео.",
      extItem4T: "Очередь и Отмена в Истории:",
      extItem4D: "Элементы плейлиста сразу отображаются в Истории в статусе 'В очереди...' и могут быть отменены.",
      srvTitle: "Companion Server и Очередь (v1.3.2)",
      srvSubtitle: "Доступен Companion Server v1.3.2!",
      srvItem1T: "Эндпоинты Обновления (/check_update, /install_update):",
      srvItem1D: "Автоматическая загрузка и запуск официального установщика через Windows UAC.",
      srvItem2T: "Последовательная Очередь Загрузки:",
      srvItem2D: "Фоновая последовательная обработка предотвращает ошибки HTTP 429 (лимит запросов).",
      srvItem3T: "Выбор Папки /select_folder:",
      srvItem3D: "Восстановлен нативный диалог выбора папки сохранения.",
      srvItem4T: "Надёжная Сериализация Истории:",
      srvItem4D: "Изоляция процессов от дисковой истории для гарантии валидного JSON.",
      ctaTitle: "💖 Поддержите проект или оставьте отзыв!",
      ctaDesc: "Если расширение вам полезно, отзыв в магазине Firefox Add-ons очень поможет проекту!",
      ctaKofi: "☕ Купите мне Ko-Fi!",
      ctaGithub: "⭐ Посмотреть на GitHub",
      ctaReview: "⭐ Оценить в Firefox Add-ons"
    },
    ja: {
      title: "YT Media Downloader — リリース v1.3.2",
      subtitle: "v1.3.2の新機能: 安全な自動アップデート、プレイリスト修正、順次キュー、履歴でのキャンセル。",
      extTitle: "自動アップデートと拡張機能の改善 (v1.3.2)",
      extItem1T: "安全な自動アップデートシステム (AV-Safe):",
      extItem1D: "GitHubからの新バージョン自動検出、進行状況バー、UAC確認付きインストーラー起動。",
      extItem2T: "プレイリストダウンロード修正:",
      extItem2D: "フォルダ選択の復元と、プレイリスト選択動画のパラメータ正常化。",
      extItem3T: "音声ダウンロードのインテリジェント制御:",
      extItem3D: "フォーマット読み込み完了までボタンを保護し、現在再生中の動画のみを正確に対象とします。",
      extItem4T: "待機キューと履歴からのキャンセル:",
      extItem4D: "プレイリスト動画が即座に履歴に「待機中...」として登録され、個別キャンセル可能。",
      srvTitle: "Companion サーバーとキューエンジン (v1.3.2)",
      srvSubtitle: "Companion サーバー v1.3.2 が利用可能です！",
      srvItem1T: "アップデートAPI (/check_update, /install_update):",
      srvItem1D: "公式インストーラーの安全なバックグラウンド取得とWindows UAC実行。",
      srvItem2T: "順次ダウンロードキュー:",
      srvItem2D: "YouTube HTTP 429レート制限エラーを防ぐ順次バックグラウンド処理。",
      srvItem3T: "ネイティブフォルダ選択 /select_folder:",
      srvItem3D: "保存先フォルダ選択ダイアログを復元。",
      srvItem4T: "履歴の安定したシリアライズ:",
      srvItem4D: "プロセスハンドルを完全に分離し、JSONエラーを防止。",
      ctaTitle: "💖 プロジェクトを応援またはレビューをお願いします！",
      ctaDesc: "このアプリが役立ちましたら、Firefox Add-ons ストアでのレビューやKo-Fiでのご支援をぜひお願いいたします！",
      ctaKofi: "☕ Ko-Fi で支援する",
      ctaGithub: "⭐ GitHub で見る",
      ctaReview: "⭐ Firefox Add-ons で評価"
    },
    zh: {
      title: "YT Media Downloader — 版本 v1.3.2",
      subtitle: "v1.3.2 新特性：防杀毒误报的安全自动更新、播放列表下载修复、顺序队列与历史记录取消。",
      extTitle: "安全自动更新与扩展增强 (v1.3.2)",
      extItem1T: "防误报的安全自动更新系统 (AV-Safe)：",
      extItem1D: "智能检测 GitHub 新版本，具备弹窗通知、实时进度条并经由 Windows UAC 正常唤起安装程序。",
      extItem2T: "播放列表下载与目录选择修复：",
      extItem2D: "恢复原生目录选择器路由，并在下载播放列表项目时彻底净化单视频参数。",
      extItem3T: "智能音频控制与意图识别：",
      extItem3D: "在格式加载完成前保护禁用音频按钮，未勾选播放列表时精准仅下载当前播放视频。",
      extItem4T: "排队中下载与历史记录实时取消：",
      extItem4D: "播放列表项目立即在历史记录中呈现为“排队中...”，支持随时单独取消。",
      srvTitle: "Companion 本地服务端与顺序队列 (v1.3.2)",
      srvSubtitle: "Companion 本地服务端 v1.3.2 已就绪！",
      srvItem1T: "更新管理端点 (/check_update, /install_update)：",
      srvItem1D: "提供官方安装程序的无感下载，并以标准系统 Shell 唤起安装。",
      srvItem2T: "顺序下载队列：",
      srvItem2D: "后台顺序下载播放列表视频，有效避免触发 YouTube HTTP 429 速率限制。",
      srvItem3T: "原生目录选择 /select_folder：",
      srvItem3D: "恢复保存目录选择对话框，顺畅配置下载路径。",
      srvItem4T: "可靠的历史记录数据存储：",
      srvItem4D: "进程句柄与磁盘历史完全解耦，根除 JSON 序列化崩溃。",
      ctaTitle: "💖 支持项目或留下好评！",
      ctaDesc: "如果您觉得本工具好用，在 Mozilla 附加组件商店留下好评将极大帮助项目推广，或请作者喝杯咖啡！",
      ctaKofi: "☕ 请我喝杯 Ko-Fi！",
      ctaGithub: "⭐ 在 GitHub 上查看",
      ctaReview: "⭐ 在 Firefox Add-ons 上评价"
    }
  };

  const setLanguage = (lang) => {
    const t = translations[lang] || translations.en;
    document.title = t.title;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };

    setTxt("cl-title", t.title);
    setTxt("cl-subtitle", t.subtitle);
    setTxt("cl-ext-title", t.extTitle);
    setTxt("cl-ext-item1-t", t.extItem1T);
    setTxt("cl-ext-item1-d", t.extItem1D);
    setTxt("cl-ext-item2-t", t.extItem2T);
    setTxt("cl-ext-item2-d", t.extItem2D);
    setTxt("cl-ext-item3-t", t.extItem3T);
    setTxt("cl-ext-item3-d", t.extItem3D);
    setTxt("cl-ext-item4-t", t.extItem4T);
    setTxt("cl-ext-item4-d", t.extItem4D);

    setTxt("cl-srv-title", t.srvTitle);
    setTxt("cl-srv-subtitle", t.srvSubtitle);
    setTxt("cl-srv-item1-t", t.srvItem1T);
    setTxt("cl-srv-item1-d", t.srvItem1D);
    setTxt("cl-srv-item2-t", t.srvItem2T);
    setTxt("cl-srv-item2-d", t.srvItem2D);
    setTxt("cl-srv-item3-t", t.srvItem3T);
    setTxt("cl-srv-item3-d", t.srvItem3D);
    setTxt("cl-srv-item4-t", t.srvItem4T);
    setTxt("cl-srv-item4-d", t.srvItem4D);

    setTxt("cl-cta-title", t.ctaTitle);
    setTxt("cl-cta-desc", t.ctaDesc);
    const kofi = document.querySelector("#cl-cta-kofi span");
    if (kofi) kofi.textContent = t.ctaKofi;
    const gh = document.querySelector("#cl-cta-github span");
    if (gh) gh.textContent = t.ctaGithub;
    const rev = document.querySelector("#cl-cta-review span");
    if (rev) rev.textContent = t.ctaReview;
  };

  if (storage) {
    storage.local.get(["defLang"], (data) => {
      const savedLang = data && data.defLang ? data.defLang : (navigator.language || "en").slice(0, 2);
      const initialLang = translations[savedLang] ? savedLang : "en";
      if (langSelect) langSelect.value = initialLang;
      setLanguage(initialLang);
    });
  } else {
    setLanguage("en");
  }

  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      setLanguage(selected);
      if (storage) storage.local.set({ defLang: selected });
    });
  }
});

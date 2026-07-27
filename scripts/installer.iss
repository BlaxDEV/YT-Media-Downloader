[Setup]
AppId=YT Downloader
AppName=YT Media Downloader Companion
AppVersion=1.2.3
AppPublisher=Gabriel
DefaultDirName={localappdata}\YT-Downloader
DefaultGroupName=YT Media Downloader
OutputBaseFilename=Setup_YT_Downloader-Win-v1.2.3
OutputDir=..\Output
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
SetupIconFile=..\icon.ico
CloseApplications=force
CloseApplicationsFilter=*.exe

[Files]
Source: "..\native-host\YTDownloader.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tools\ffmpeg.exe"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "..\tools\ffprobe.exe"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "..\tools\yt-dlp.exe"; DestDir: "{app}\tools"; Flags: ignoreversion

[Icons]
Name: "{group}\YT Media Downloader Server"; Filename: "{app}\YTDownloader.exe"
Name: "{userstartup}\YT Media Downloader Server"; Filename: "{app}\YTDownloader.exe"
Name: "{group}\Uninstall YT Media Downloader"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\YTDownloader.exe"; Description: "Launch YT Media Downloader Server"; Flags: nowait postinstall runhidden

[Code]
var
  MaintenancePage: TInputOptionWizardPage;
  IsMaintenanceMode: Boolean;

function IsAppInstalled: Boolean;
var
  UninstallPath: String;
begin
  Result := RegQueryStringValue(HKLM, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\YT Downloader_is1', 'UninstallString', UninstallPath) or
            RegQueryStringValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\YT Downloader_is1', 'UninstallString', UninstallPath);
end;

function IsBrowserRunning(const ExeName: String): Boolean;
var
  ResultCode: Integer;
begin
  Exec('tasklist', '/FI "IMAGENAME eq ' + ExeName + '" /NH', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := (ResultCode = 0);
end;

procedure KillProcess(const ExeName: String);
var
  ResultCode: Integer;
begin
  Exec('taskkill', '/F /IM ' + ExeName, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

function CloseAllBrowsers: Boolean;
var
  Browsers: array[0..5] of String;
  I: Integer;
begin
  Browsers[0] := 'chrome.exe';
  Browsers[1] := 'msedge.exe';
  Browsers[2] := 'firefox.exe';
  Browsers[3] := 'brave.exe';
  Browsers[4] := 'opera.exe';
  Browsers[5] := 'vivaldi.exe';

  for I := 0 to 5 do
    KillProcess(Browsers[I]);

  // Small wait for processes to fully close
  Sleep(1500);
  Result := True;
end;

procedure ExportBrowserCookies;
var
  YtdlpPath, CookiesPath: String;
  ResultCode: Integer;
  Browsers: array[0..5] of String;
  I: Integer;
begin
  YtdlpPath := ExpandConstant('{app}\tools\yt-dlp.exe');
  CookiesPath := ExpandConstant('{userappdata}\..\Downloads\YTMediaDownloader\.yt_cookies.txt');

  if not FileExists(YtdlpPath) then Exit;

  Browsers[0] := 'chrome';
  Browsers[1] := 'edge';
  Browsers[2] := 'firefox';
  Browsers[3] := 'brave';
  Browsers[4] := 'opera';
  Browsers[5] := 'vivaldi';

  for I := 0 to 5 do
  begin
    Exec(YtdlpPath,
      '--cookies-from-browser ' + Browsers[I] + ' --cookies "' + CookiesPath + '" --skip-download --no-warnings "https://www.youtube.com/watch?v=jNQXAC9IVRw"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if (ResultCode = 0) and FileExists(CookiesPath) then
    begin
      Log('Cookies exported successfully from ' + Browsers[I]);
      Exit;
    end;
  end;
  Log('Could not export cookies from any browser.');
end;

procedure InitializeWizard;
begin
  IsMaintenanceMode := IsAppInstalled();
  
  if IsMaintenanceMode then
  begin
    MaintenancePage := CreateInputOptionPage(wpWelcome,
      'Mantenimiento de YT Media Downloader', 'El servidor ya se encuentra instalado en tu sistema.',
      '¿Qué deseas hacer?', True, False);
      
    MaintenancePage.Add('Reparar / Actualizar servidor (Reinstalar)');
    MaintenancePage.Add('Verificar servidor y encenderlo (Ignorar instalación)');
    MaintenancePage.Add('Desinstalar programa completamente');
    
    MaintenancePage.SelectedValueIndex := 0;
  end;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  if IsMaintenanceMode then
  begin
    // Skip all standard pages if in maintenance mode except our custom page and ready page
    if (PageID = wpSelectDir) or (PageID = wpSelectProgramGroup) or (PageID = wpSelectTasks) or (PageID = wpReady) then
      Result := True;
  end;
end;

function PrepInstall(CurPageID: Integer): Boolean;
var
  MsgResult: Integer;
begin
  Result := True;
  if CurPageID = wpReady then
  begin
    MsgResult := MsgBox(
      'Para una instalación correcta se deben cerrar todos los navegadores (Chrome, Edge, Firefox, Brave, etc.).' + #13#10 + #13#10 +
      'Esto es necesario para poder extraer las cookies de YouTube y habilitar la descarga en todas las calidades (1080p, 720p, etc.).' + #13#10 + #13#10 +
      '¿Deseas cerrar todos los navegadores ahora y continuar?',
      mbConfirmation, MB_YESNO);
    if MsgResult = IDNO then
    begin
      MsgBox('No se puede continuar sin cerrar los navegadores.' + #13#10 + 'Por favor ciérralos manualmente y vuelve a intentar.', mbError, MB_OK);
      Result := False;
    end
    else
    begin
      CloseAllBrowsers;
    end;
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  ResultCode: Integer;
  UninstallStr: String;
begin
  Result := True;

  // Handle browser close on Ready page
  if (CurPageID = wpReady) and (not IsMaintenanceMode) then
  begin
    Result := PrepInstall(CurPageID);
    Exit;
  end;

  if (IsMaintenanceMode) and (CurPageID = MaintenancePage.ID) then
  begin
    if MaintenancePage.SelectedValueIndex = 2 then // Desinstalar
    begin
      if RegQueryStringValue(HKLM, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\YT Downloader_is1', 'QuietUninstallString', UninstallStr) or
         RegQueryStringValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\YT Downloader_is1', 'QuietUninstallString', UninstallStr) then
      begin
        UninstallStr := RemoveQuotes(UninstallStr);
        Exec(UninstallStr, '/SILENT', '', SW_SHOW, ewWaitUntilTerminated, ResultCode);
        MsgBox('Desinstalación completada. El programa se cerrará.', mbInformation, MB_OK);
        Result := False;
        WizardForm.Close;
      end;
    end
    else if MaintenancePage.SelectedValueIndex = 1 then // Verificar y encender
    begin
      Exec(ExpandConstant('{app}\YTDownloader.exe'), '--hidden', '', SW_HIDE, ewNoWait, ResultCode);
      MsgBox('Servidor verificado e iniciado en segundo plano. El programa se cerrará.', mbInformation, MB_OK);
      Result := False;
      WizardForm.Close;
    end
    else // Reparar - also need to close browsers
    begin
      Result := PrepInstall(wpReady);
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Export cookies after installation (browsers are closed at this point)
    ExportBrowserCookies;
  end;
end;

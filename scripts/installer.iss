[Setup]
AppId=YT Downloader
AppName=YT Media Downloader Companion
AppVersion=1.2.1
AppPublisher=Gabriel
DefaultDirName={localappdata}\YT-Downloader
DefaultGroupName=YT Media Downloader
OutputBaseFilename=Setup_YT_Downloader-Win-v1.2.1
OutputDir=..\
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
SetupIconFile=..\icon.ico

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

function NextButtonClick(CurPageID: Integer): Boolean;
var
  ResultCode: Integer;
  UninstallStr: String;
begin
  Result := True;
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
    end;
  end;
end;


@echo off
REM Gera o certificado local usado pelo perfil "https" do backend.
REM O arquivo .p12 fica fora do git: cada maquina gera o seu.
REM Uso: config\gerar_certificado.bat

setlocal
set "SENHA=smarthas-local"
set "DESTINO=%~dp0smarthas-local.p12"

if exist "%DESTINO%" (
  echo Ja existe um certificado em %DESTINO%. Apague o arquivo para gerar outro.
  goto :fim
)

keytool -genkeypair -alias smarthas -keyalg RSA -keysize 2048 -validity 825 ^
  -storetype PKCS12 -keystore "%DESTINO%" -storepass %SENHA% ^
  -dname "CN=localhost, OU=Smart HAS, O=FIAP, L=Sao Paulo, ST=SP, C=BR" ^
  -ext "SAN=dns:localhost,ip:127.0.0.1,ip:10.0.2.2"

echo.
echo Certificado criado em %DESTINO%
echo Suba o backend com: mvnw spring-boot:run -Dspring-boot.run.profiles=https

:fim
endlocal
pause

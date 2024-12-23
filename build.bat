@echo off
REM Create directories if they don't exist
mkdir .\exe\windows 2>nul
mkdir .\exe\linux 2>nul
mkdir .\exe\macos 2>nul

echo Start generating executables...

REM Build for Windows
set GOOS=windows
set GOARCH=amd64
go build -o .\exe\windows\inj.exe inj.go

REM Build for Linux
set GOOS=linux
set GOARCH=amd64
go build -o .\exe\linux\inj inj.go

REM Build for macOS
set GOOS=darwin
set GOARCH=amd64
go build -o .\exe\macos\inj inj.go

echo Build completed!

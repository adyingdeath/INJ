package main

import (
    "os"
    "os/exec"
    "path/filepath"
)

func main() {
    // Get executable path
    ex, err := os.Executable()
    if err != nil {
        panic(err)
    }
    exPath := filepath.Dir(ex)
    
    // Get current working directory (where user runs the command)
    userWorkDir, err := os.Getwd()
    if err != nil {
        panic(err)
    }
    
    // Prepare command
    scriptPath := filepath.Join("dist", "inj.js")
    
    // Convert relative paths in arguments to absolute paths
    args := make([]string, len(os.Args[1:]))
    for i, arg := range os.Args[1:] {
        if filepath.IsAbs(arg) {
            args[i] = arg
        } else {
            // Only convert if it looks like a file path
            if _, err := os.Stat(filepath.Join(userWorkDir, arg)); err == nil {
                args[i] = filepath.Join(userWorkDir, arg)
            } else {
                args[i] = arg
            }
        }
    }
    
    // Create command
    cmd := exec.Command("node", scriptPath)
    cmd.Args = append(cmd.Args, args...)
    cmd.Dir = exPath
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    cmd.Stdin = os.Stdin
    
    // Run
    if err := cmd.Run(); err != nil {
        os.Exit(1)
    }
}
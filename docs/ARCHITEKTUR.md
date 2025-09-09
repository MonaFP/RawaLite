```mermaid
sequenceDiagram
    Renderer->>Main: ipc db:save(bytes)
    Main->>FileSystem: write %APPDATA%/db
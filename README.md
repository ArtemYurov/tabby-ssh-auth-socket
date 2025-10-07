# Tabby SSH Auth Socket Plugin

A Tabby terminal plugin to configure custom SSH authentication socket paths for use with SSH agents like Secretive, 1Password, GPG, and others.

<img width="622" height="438" alt="image" src="https://github.com/user-attachments/assets/27ebfe2d-af1c-43cb-83a5-58aa54f25d6f" />

## Features

- Configure custom `SSH_AUTH_SOCK` environment variable for all SSH connections
- Support for popular SSH agents:
  - Secretive
  - 1Password
  - GPG Agent
- Import socket path from `~/.ssh/config`
- Test connection to verify socket works
- Path expansion support (`~`, environment variables)

## Installation

Install from Tabby's plugin manager by searching for `tabby-ssh-auth-socket`, or install manually:

```bash
npm install -g tabby-ssh-auth-socket
```

## Usage

1. Open Tabby settings
2. Go to "SSH Auth Socket" section
3. Enter your SSH agent socket path, or click "Import from ~/.ssh/config"
4. Click "Test Connection" to verify it works
5. Socket will be applied to all new SSH connections

## Common Socket Paths

- **Secretive**: `~/Library/Containers/com.maxgoedjen.Secretive.SecretAgent/Data/socket.ssh`
- **1Password**: `~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock`
- **GPG Agent**: `~/.gnupg/S.gpg-agent.ssh`

## License

MIT

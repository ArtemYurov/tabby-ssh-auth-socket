import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface KnownAgent {
    name: string
    path: string
    exists?: boolean
}

export class SSHConfigParser {

    async parseSSHConfig(): Promise<string[]> {
        const configPath = path.join(os.homedir(), '.ssh', 'config')
        const sockets: string[] = []

        try {
            if (!fs.existsSync(configPath)) {
                return sockets
            }

            const content = await fs.promises.readFile(configPath, 'utf8')

            // Parse IdentityAgent directives from SSH config
            // Match both IdentityAgent and IDENTITYAGENT (case insensitive)
            const regex = /^\s*IdentityAgent\s+(.+)$/gmi
            let match

            while ((match = regex.exec(content)) !== null) {
                let socketPath = match[1].trim()

                // Remove quotes if present
                socketPath = socketPath.replace(/^["']|["']$/g, '')

                // Expand ~ to home directory
                if (socketPath.startsWith('~/')) {
                    socketPath = path.join(os.homedir(), socketPath.slice(2))
                } else if (socketPath === '~') {
                    socketPath = os.homedir()
                }

                // Expand environment variables like $HOME
                socketPath = socketPath.replace(/\$([A-Z_][A-Z0-9_]*)/gi, (_, varName) => {
                    return process.env[varName] || ''
                })

                // Only add valid, unique paths
                if (socketPath && !sockets.includes(socketPath)) {
                    sockets.push(socketPath)
                }
            }
        } catch (error) {
            console.error('Error parsing SSH config:', error)
        }

        return sockets
    }

    async findKnownAgentSockets(): Promise<KnownAgent[]> {
        const agents: KnownAgent[] = []

        // Known agent socket locations
        const knownAgents: KnownAgent[] = [
            {
                name: 'Secretive',
                path: path.join(os.homedir(), 'Library/Containers/com.maxgoedjen.Secretive.SecretAgent/Data/socket.ssh')
            },
            {
                name: '1Password',
                path: path.join(os.homedir(), 'Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock')
            },
            {
                name: 'GPG Agent',
                path: path.join(os.homedir(), '.gnupg/S.gpg-agent.ssh')
            },
            {
                name: 'Default SSH Agent',
                path: '/private/tmp/com.apple.launchd.*/Listeners'
            }
        ]

        // First, add all known agents
        for (const agent of knownAgents) {
            // For patterns with wildcards, try to find actual socket
            if (agent.path.includes('*')) {
                const dir = path.dirname(agent.path)
                const pattern = path.basename(agent.path)

                try {
                    if (fs.existsSync(dir)) {
                        const files = await fs.promises.readdir(dir)
                        for (const file of files) {
                            if (file.match(pattern.replace('*', '.*'))) {
                                const fullPath = path.join(dir, file, 'Listeners')
                                if (await this.checkSocketExists(fullPath)) {
                                    agents.push({
                                        name: agent.name,
                                        path: fullPath,
                                        exists: true
                                    })
                                    break
                                }
                            }
                        }
                    }
                } catch (error) {
                    // Ignore errors for inaccessible directories
                }
            } else {
                const exists = await this.checkSocketExists(agent.path)
                // Always show Secretive, show others only if they exist
                if (agent.name === 'Secretive' || exists) {
                    agents.push({
                        name: agent.name,
                        path: agent.path,
                        exists
                    })
                }
            }
        }

        // Then add any additional sockets from SSH config that weren't already added
        try {
            const configSockets = await this.parseSSHConfig()
            for (const socketPath of configSockets) {
                // Skip if already added
                if (agents.some(a => a.path === socketPath)) {
                    continue
                }

                const exists = await this.checkSocketExists(socketPath)
                agents.push({
                    name: 'SSH Config',
                    path: socketPath,
                    exists
                })
            }
        } catch (error) {
            console.error('Error parsing SSH config:', error)
        }

        return agents
    }

    private async checkSocketExists(socketPath: string): Promise<boolean> {
        try {
            const stats = await fs.promises.stat(socketPath)
            // Check if it's a socket file
            return stats.isSocket()
        } catch {
            return false
        }
    }

    expandPath(socketPath: string): string {
        // Expand ~ to home directory
        if (socketPath.startsWith('~/')) {
            socketPath = path.join(os.homedir(), socketPath.slice(2))
        } else if (socketPath === '~') {
            socketPath = os.homedir()
        }

        // Expand environment variables
        socketPath = socketPath.replace(/\$([A-Z_][A-Z0-9_]*)/gi, (_, varName) => {
            return process.env[varName] || ''
        })

        return socketPath
    }
}
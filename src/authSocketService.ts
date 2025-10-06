import { Injectable } from '@angular/core'
import { ConfigService, LogService, Logger } from 'tabby-core'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { SSHConfigParser } from './sshConfigParser'

@Injectable({ providedIn: 'root' })
export class SSHAuthSocketService {
    private logger: Logger
    private parser: SSHConfigParser
    private originalSocketPath: string | undefined

    constructor(
        private config: ConfigService,
        log: LogService,
    ) {
        this.logger = log.create('ssh-auth-socket')
        this.parser = new SSHConfigParser()

        // Save original SSH_AUTH_SOCK value
        this.originalSocketPath = process.env.SSH_AUTH_SOCK

        // Wait for config to be ready before applying socket path
        this.config.ready$.toPromise().then(() => {
            // Check if plugin is disabled in plugin blacklist
            if (this.config.store.pluginBlacklist?.includes('tabby-ssh-auth-socket')) {
                this.logger.info('SSH Auth Socket plugin is disabled in plugin settings')
                return
            }

            this.applySocketPath()

            // Subscribe to configuration changes
            this.config.changed$.subscribe(() => {
                this.applySocketPath()
            })
        })
    }

    applySocketPath(): void {
        if (!this.config.store || !this.config.store.sshAuthSocket) {
            return
        }

        // Check if plugin is disabled in plugin blacklist
        if (this.config.store.pluginBlacklist?.includes('tabby-ssh-auth-socket')) {
            this.logger.info('SSH Auth Socket plugin is disabled in plugin settings')
            return
        }

        const socketPath = this.config.store.sshAuthSocket.socketPath

        if (!socketPath) {
            // Clear SSH_AUTH_SOCK when field is empty
            delete process.env.SSH_AUTH_SOCK
            this.logger.info('SSH_AUTH_SOCK cleared')
            return
        }

        const expandedPath = this.parser.expandPath(socketPath)

        // Check if socket exists
        if (this.checkSocketExists(expandedPath)) {
            process.env.SSH_AUTH_SOCK = expandedPath
            this.logger.info(`SSH_AUTH_SOCK set to: ${expandedPath}`)
        } else {
            this.logger.warn(`Socket not found: ${expandedPath}`)
            // Still set it as user configured it
            process.env.SSH_AUTH_SOCK = expandedPath
            this.logger.info(`SSH_AUTH_SOCK set to: ${expandedPath} (socket not found)`)
        }
    }

    private checkSocketExists(socketPath: string): boolean {
        try {
            const stats = fs.statSync(socketPath)
            return stats.isSocket()
        } catch {
            return false
        }
    }

    async detectSockets(): Promise<Array<{ name: string, path: string, exists?: boolean }>> {
        return await this.parser.findKnownAgentSockets()
    }

    async testSocket(socketPath: string): Promise<boolean> {
        const expandedPath = this.parser.expandPath(socketPath)

        // First check if file exists and is a socket
        if (!this.checkSocketExists(expandedPath)) {
            return false
        }

        // Try to connect to the socket
        // This is a basic test - just check if we can establish connection
        return new Promise<boolean>((resolve) => {
            const net = require('net')
            const client = net.createConnection(expandedPath)

            client.on('connect', () => {
                client.end()
                resolve(true)
            })

            client.on('error', () => {
                resolve(false)
            })

            // Timeout after 1 second
            setTimeout(() => {
                client.destroy()
                resolve(false)
            }, 1000)
        })
    }

    getCurrentSocketPath(): string | undefined {
        return process.env.SSH_AUTH_SOCK
    }

    isEnabled(): boolean {
        return this.config.store.sshAuthSocket?.enabled === true
    }

    getConfiguredPath(): string | undefined {
        return this.config.store.sshAuthSocket?.socketPath
    }

    async autoDetectFromSSHConfig(): Promise<string | null> {
        const sockets = await this.parser.parseSSHConfig()

        // Return the first valid socket found
        for (const socket of sockets) {
            const expandedPath = this.parser.expandPath(socket)
            if (this.checkSocketExists(expandedPath)) {
                return socket
            }
        }

        // If no valid socket found, return the first one anyway
        return sockets.length > 0 ? sockets[0] : null
    }
}
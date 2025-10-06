import { Component, OnInit } from '@angular/core'
import { ConfigService, NotificationsService } from 'tabby-core'
import { SSHAuthSocketService } from '../authSocketService'

@Component({
    selector: 'ssh-auth-socket-settings',
    templateUrl: './settingsTab.component.pug',
})
export class SSHAuthSocketSettingsComponent implements OnInit {
    testResult: string | null = null
    testing = false

    constructor(
        public config: ConfigService,
        private authSocketService: SSHAuthSocketService,
        private notifications: NotificationsService,
    ) {}

    async ngOnInit(): Promise<void> {
        // Initialize config if not exists
        if (!this.config.store.sshAuthSocket) {
            this.config.store.sshAuthSocket = {
                socketPath: '',
            }
        }
    }

    async importFromConfig(): Promise<void> {
        try {
            const detectedPath = await this.authSocketService.autoDetectFromSSHConfig()

            if (detectedPath && this.config.store.sshAuthSocket) {
                this.config.store.sshAuthSocket.socketPath = detectedPath
                this.config.save()
                this.notifications.notice(`Imported socket from SSH config: ${detectedPath}`)
            } else {
                this.notifications.info('No socket path found in ~/.ssh/config')
            }
        } catch (error) {
            this.notifications.error(`Failed to parse SSH config: ${error}`)
        }
    }

    async testConnection(): Promise<void> {
        this.testing = true
        this.testResult = null

        const socketPath = this.config.store.sshAuthSocket?.socketPath
        if (!socketPath) {
            this.notifications.error('No socket path configured')
            this.testing = false
            return
        }

        try {
            const success = await this.authSocketService.testSocket(socketPath)

            if (success) {
                this.testResult = 'success'
                this.notifications.notice('Successfully connected to SSH agent')
            } else {
                this.testResult = 'failed'
                this.notifications.error('Failed to connect to SSH agent')
            }
        } catch (error) {
            this.testResult = 'failed'
            this.notifications.error(`Test failed: ${error}`)
        } finally {
            this.testing = false
        }
    }

}
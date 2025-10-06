import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { SSHAuthSocketSettingsComponent } from './components/settingsTab.component'

@Injectable()
export class SSHAuthSocketSettingsTabProvider extends SettingsTabProvider {
    id = 'ssh-auth-socket'
    icon = 'key'
    title = 'SSH Auth Socket'

    getComponentType (): any {
        return SSHAuthSocketSettingsComponent
    }
}
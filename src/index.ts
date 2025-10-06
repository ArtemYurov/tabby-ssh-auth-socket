import { NgModule, Inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import TabbyCoreModule, { ConfigProvider } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'

import { SSHAuthSocketConfigProvider } from './config'
import { SSHAuthSocketSettingsTabProvider } from './settings'
import { SSHAuthSocketSettingsComponent } from './components/settingsTab.component'
import { SSHAuthSocketService } from './authSocketService'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TabbyCoreModule,
    ],
    providers: [
        { provide: ConfigProvider, useClass: SSHAuthSocketConfigProvider, multi: true },
        { provide: SettingsTabProvider, useClass: SSHAuthSocketSettingsTabProvider, multi: true },
        SSHAuthSocketService,
    ],
    declarations: [
        SSHAuthSocketSettingsComponent,
    ],
})
export default class SSHAuthSocketModule {
    // Force service initialization on module load
    constructor(@Inject(SSHAuthSocketService) _service: SSHAuthSocketService) {}
}
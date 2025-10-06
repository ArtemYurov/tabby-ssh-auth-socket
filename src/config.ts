import { ConfigProvider } from 'tabby-core'

export class SSHAuthSocketConfigProvider extends ConfigProvider {
    defaults = {
        sshAuthSocket: {
            socketPath: '',
        }
    }

    platformDefaults = {}
}

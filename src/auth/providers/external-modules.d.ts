/**
 * Minimal typings for optional auth SDKs so `tsc` passes when they are not installed.
 * Signatures mirror the subset of @ory/client-fetch v1.x that `ory.ts` uses (native flows).
 */

declare module '@ory/client-fetch' {
  export interface ConfigurationParameters {
    basePath?: string
  }

  export class Configuration {
    constructor(configuration?: ConfigurationParameters)
  }

  export interface Identity {
    id: string
    traits: unknown
  }

  export interface Session {
    id: string
    identity?: Identity
  }

  export interface LoginFlow {
    id: string
  }

  export interface SuccessfulNativeLogin {
    session: Session
    session_token?: string
  }

  export class FrontendApi {
    constructor(configuration?: Configuration)
    toSession(requestParameters?: { xSessionToken?: string }): Promise<Session>
    createNativeLoginFlow(): Promise<LoginFlow>
    updateLoginFlow(requestParameters: {
      flow: string
      updateLoginFlowBody: { method: 'password'; identifier: string; password: string }
    }): Promise<SuccessfulNativeLogin>
    performNativeLogout(requestParameters: {
      performNativeLogoutBody: { session_token: string }
    }): Promise<void>
  }
}
